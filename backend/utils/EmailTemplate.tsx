/** @jsxImportSource https://esm.sh/react@19.0.0 */

import React from "https://esm.sh/react@19.0.0";

interface EmailTemplateProps {
  magicLink: string;
}

export const EmailTemplate: React.FC<EmailTemplateProps> = ({ magicLink }) => {
  return (
    <div>
      <h1>Your Magic Link</h1>
      <p>Click the link below to sign in:</p>
      <a href={magicLink}>{magicLink}</a>
    </div>
  );
};
