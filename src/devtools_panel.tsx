import React, { useState, useEffect } from "react";

import ReactDOM from "react-dom/client";
import browser from "webextension-polyfill";

type OGData = Record<string, string>;
type EvalResponse = OGData | [OGData | undefined, { description?: string } | undefined];

const OGTagViewer = () => {
  const [ogData, setOgData] = useState<OGData>({});

  useEffect(() => {
    let navigationTimeout: number | null = null;

    const fetchOGTags = async () => {
      try {
        const response = (await browser.devtools.inspectedWindow.eval(`
          (function() {
            const ogTags = document.querySelectorAll('meta[property^="og:"]');
            const ogData = {};
            ogTags.forEach(tag => {
              ogData[tag.getAttribute('property')] = tag.getAttribute('content');
            });
            return ogData;
          })()
        `)) as EvalResponse;

        // Chromium's native Promise returns the value directly; Firefox and the
        // polyfill return [value, exceptionInfo].
        const [result, exceptionInfo] = Array.isArray(response)
          ? response
          : [response, undefined];

        // Check if there was an exception (e.g., no execution context)
        if (exceptionInfo) {
          console.log("Could not fetch OG tags (page may be loading):", exceptionInfo.description);
          return;
        }

        if (result) {
          setOgData(result);
        }
      } catch (error) {
        console.error("Error fetching OG tags:", error);
      }
    };

    fetchOGTags();

    const onNavigated = () => {
      console.log("Page navigated, refreshing OG tags...");
      
      // Clear any pending refresh to debounce multiple navigation events
      if (navigationTimeout) {
        clearTimeout(navigationTimeout);
      }
      
      // Wait a bit for the page to load before trying to fetch OG tags
      navigationTimeout = setTimeout(() => {
        fetchOGTags();
      }, 100);
    };

    const onRequestFinished = (request: any) => {
      // Get the HAR entry details
      const { request: req, response } = request;
      
      // Get the content type from response headers
      const contentType = response.content?.mimeType || '';
      
      // Filter for document (HTML) and JSON requests that might update the page
      // Skip images, CSS, fonts, etc.
      const relevantTypes = ['text/html', 'application/json', 'application/xhtml+xml'];
      const isRelevant = relevantTypes.some(type => contentType.includes(type));
      
      if (isRelevant && response.status === 200) {
        console.log("Relevant request finished:", req.url, "Type:", contentType);
        
        // Clear any pending refresh to debounce
        if (navigationTimeout) {
          clearTimeout(navigationTimeout);
        }
        
        navigationTimeout = setTimeout(() => {
          fetchOGTags();
        }, 100);
      }
    };

    browser.devtools.network.onNavigated.addListener(onNavigated);
    browser.devtools.network.onRequestFinished.addListener(onRequestFinished);

    return () => {
      browser.devtools.network.onNavigated.removeListener(onNavigated);
      browser.devtools.network.onRequestFinished.removeListener(onRequestFinished);
      if (navigationTimeout) {
        clearTimeout(navigationTimeout);
      }
    };
  }, []);

  return (
    <div>
      <h2>Open Graph Tags</h2>
      <table>
        <thead>
          <tr>
            <th>Property</th>
            <th>Content</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(ogData).map(([property, content]) => (
            <tr key={property}>
              <td>{property}</td>
              <td>{content}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Open Graph Image</h2>
      {ogData["og:image"] ? (
        <img
          src={ogData["og:image"]}
          alt="OG Image"
          style={{ maxWidth: "300px", maxHeight: "300px" }}
        />
      ) : (
        <p>No OG image found</p>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <OGTagViewer />
  </React.StrictMode>,
);
