// The installable Bidcore programs (Windows, run on the customer's own computer; see bidcoreai/desktop). Each is a separate program with its own database and
// licence. Every program starts with a 30-day free trial on its own, with no licence file and no card; when the trial ends it does not open, and the yearly
// subscription (a signed licence file, issued after a request) keeps it running. Yearly only - there is no monthly option.

export interface SoftwareProduct {
  key: "tender-connect" | "takeoff-india" | "takeoff-us"; // = the desktop/products file name = the licence generator's --product
  name: string;
  country: string;
  blurb: string;
  features: string[];
  installer: string; // the file name on the release
  available: boolean; // false until the installer is published as a release asset
}

export const SOFTWARE: SoftwareProduct[] = [
  {
    key: "tender-connect",
    name: "Starter Lite: Tender Connect",
    country: "India",
    blurb: "Publish public and private tenders, find contractors and quote, from your own computer.",
    features: ["Opportunities and the tender board", "Quotations and Go / No-Go checks", "Publish public tenders to Bidcore.in", "Company profile and Bidcore contractor network"],
    installer: "BidcoreAI-TenderConnect-Setup.exe",
    available: false,
  },
  {
    key: "takeoff-india",
    name: "Starter Lite: Takeoff (India)",
    country: "India",
    blurb: "Digital quantity takeoff from drawings, with CPWD, E&M and MoRTH cost databases.",
    features: ["Takeoff from PDF drawings", "Project list and settings", "CPWD, E&M and MoRTH cost databases", "Works offline, your data stays on your computer"],
    installer: "BidcoreAI-Takeoff-IN-Setup.exe",
    available: false,
  },
  {
    key: "takeoff-us",
    name: "Starter Lite: Takeoff (United States)",
    country: "United States",
    blurb: "Digital quantity takeoff from drawings, with US cost databases and units.",
    features: ["Takeoff from PDF drawings", "Project list and settings", "US cost databases", "Works offline, your data stays on your computer"],
    installer: "BidcoreAI-Takeoff-US-Setup.exe",
    available: false,
  },
];

export const TRIAL_DAYS = 30;
// Installers are public release files of this website's repository (a public repository: free hosting). Without a valid licence the program does nothing after the trial.
export const RELEASES_REPO = "archbarkhash-source/bidcore_website";
export const downloadUrl = (p: SoftwareProduct) => `https://github.com/${RELEASES_REPO}/releases/latest/download/${p.installer}`;
export const productOf = (key: string | undefined | null) => SOFTWARE.find((p) => p.key === key);
