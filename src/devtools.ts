import browser from "webextension-polyfill";

browser.devtools.panels.create("Open Graph", "", "src/devtools_panel.html");
