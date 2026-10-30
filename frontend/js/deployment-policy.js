// Public, version-controlled targets. Staging is deliberately disabled until
// verified resource identities are approved and a staging artifact is generated.
export const DEPLOYMENT = {
  mode: "production",
  production: {
    frontendOrigins: ["https://snapupevents.com", "https://www.snapupevents.com", "https://snapup-events.pages.dev", "https://snapup-events.netlify.app"],
    apiOrigin: "https://snapup-events-api.onrender.com",
    additionalApiOrigins: ["https://api.snapupevents.com"],
    mediaOrigins: ["https://media.snapupevents.com", "https://res.cloudinary.com"]
  },
  staging: null
};
