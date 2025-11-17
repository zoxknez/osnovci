/**
 * Base Email Template System
 * Modern, reusable email templates with consistent styling
 */

export interface EmailTemplateData {
  userName: string;
  [key: string]: unknown;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Base HTML template wrapper with consistent styling
 */
export function createBaseTemplate(
  content: string,
  title: string,
): string {
  return `<!DOCTYPE html>
<html lang="sr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(title)}</title>
  <style>
    /* Modern, responsive email styles */
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .email-header {
      text-align: center;
      padding: 30px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      border-bottom: 3px solid #667eea;
    }
    .email-header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      line-height: 1.4;
    }
    .email-content {
      padding: 30px 20px;
      color: #333333;
      line-height: 1.6;
    }
    .email-content p {
      margin: 0 0 16px 0;
      font-size: 16px;
    }
    .email-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin: 20px 0;
      font-size: 16px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .email-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
    }
    .code-block {
      background-color: #f0f7ff;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
      margin: 20px 0;
      word-break: break-all;
      font-size: 14px;
      color: #333333;
      font-family: 'Courier New', Courier, monospace;
      line-height: 1.5;
    }
    .warning-box {
      background-color: #fff3cd;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #ffc107;
      margin: 20px 0;
    }
    .warning-box strong {
      color: #856404;
    }
    .info-box {
      background-color: #d1ecf1;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #17a2b8;
      margin: 20px 0;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .stat-box {
      background: #f0f9ff;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
      text-align: center;
    }
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #667eea;
      margin: 0;
    }
    .stat-label {
      font-size: 12px;
      color: #666666;
      margin-top: 5px;
    }
    .email-footer {
      text-align: center;
      padding: 20px;
      border-top: 1px solid #eeeeee;
      background-color: #fafafa;
      font-size: 12px;
      color: #999999;
    }
    .email-footer p {
      margin: 8px 0;
      font-size: 12px;
    }
    /* Mobile responsive */
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        margin: 0;
        border-radius: 0;
      }
      .email-header, .email-content {
        padding: 20px 15px;
      }
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-header">
      <h1>${escapeHtml(title)}</h1>
    </div>
    <div class="email-content">
      ${content}
    </div>
    <div class="email-footer">
      <p><strong>Osnovci</strong> - Aplikacija za Učenike i Roditelje</p>
      <p>© ${new Date().getFullYear()} Sva Prava Zadržana</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m] ?? m);
}

/**
 * Create plain text version from HTML content
 */
export function createPlainText(html: string): string {
  // Remove HTML tags and convert to plain text
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

