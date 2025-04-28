type EmailOptions = {
  to?: string;
  subject?: string;
  text?: string;
  html?: string;
  name?: string;
};

// Send email using Wolf's email sender service
export async function sendEmail(options: EmailOptions, background = false) {
  const responsePromise = fetch("https://wolf-emailsender.web.val.run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: options.name || "Fix It Wand",
      email: options.to,
      subject: options.subject,
      content: options.text,
      html: options.html,
    }),
  });

  if (background) return;

  const response = await responsePromise;

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to send email: ${JSON.stringify(errorData)}`);
  }
}

import { generate } from "https://esm.sh/random-words@2.0.1";

export function generatePassphrase(wordsPerPassphrase = 4, separator = "-") {
  const words = generate({ exactly: wordsPerPassphrase });
  return Array.isArray(words) ? words.join(separator) : words;
}

export function generateWords(wordCount = 4) {
  const words = generate({ exactly: wordCount });
  return Array.isArray(words) ? words : [words];
}
