import React, { useState, useEffect } from "react";

import ReactDOM from "react-dom/client";
import browser from "webextension-polyfill";

const OGTagViewer = () => {
  const [ogData, setOgData] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchOGTags = async () => {
      try {
        const [result] = await browser.devtools.inspectedWindow.eval(`
          (function() {
            const ogTags = document.querySelectorAll('meta[property^="og:"]');
            const ogData = {};
            ogTags.forEach(tag => {
              ogData[tag.getAttribute('property')] = tag.getAttribute('content');
            });
            return ogData;
          })()
        `);

        if (result) {
          setOgData(result);
        }
      } catch (error) {
        console.error("Error fetching OG tags:", error);
      }
    };

    fetchOGTags();

    const onNavigated = () => {
      fetchOGTags();
    };

    browser.devtools.network.onNavigated.addListener(onNavigated);

    return () => {
      browser.devtools.network.onNavigated.removeListener(onNavigated);
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
