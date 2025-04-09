/** @jsxImportSource https://esm.sh/react@19.0.0 */

// Use environment variables or fallback to default values for development
export const MAGIC_LINK_SECRET = Deno.env.get("MAGIC_LINK_SECRET")!;
export const JWT_SECRET = Deno.env.get("JWT_SECRET")!;
export const VAL_TOWN_API_KEY = Deno.env.get("valtown")!;

export const EmailTemplate = ({ magicLink }) => (
  <div>
    <h1>Fix It Wand Magic Sign In</h1>
    <p>Click the button below to log in to Fix it Wand:</p>
    <a
      href={magicLink}
      style={{
        display: "inline-block",
        backgroundColor: "#4CAF50",
        color: "white",
        padding: "10px 20px",
        textDecoration: "none",
        borderRadius: "4px",
      }}
    >
      Log In
    </a>
    <p>Or copy and paste this URL into your browser:</p>
    <p>{magicLink}</p>
    <p>This link will expire in 15 minutes.</p>
  </div>
);

export const JWT_COOKIE_EXPIRATION = Math.floor(Date.now() / 1000) +
  60 * 60 * 24 * 7;
