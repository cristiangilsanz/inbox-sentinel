import { gmail_v1 } from 'googleapis';

export class MimeParser {
  // Extract text body prioritizing richest payload between plain text and html
  static extractBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
    if (!payload) return '';

    let plainText = '';
    let htmlText = '';

    const walk = (part: gmail_v1.Schema$MessagePart) => {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        plainText += Buffer.from(part.body.data, 'base64url').toString('utf-8') + '\n';
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        htmlText += Buffer.from(part.body.data, 'base64url').toString('utf-8') + '\n';
      }

      if (part.parts) {
        for (const subPart of part.parts) {
          walk(subPart);
        }
      }
    };

    walk(payload);

    const cleanedPlain = this.cleanText(plainText);
    const cleanedHtml = this.cleanText(this.cleanHtml(htmlText));

    if (cleanedPlain.length > 300 && cleanedPlain.length >= cleanedHtml.length * 0.4) {
      return cleanedPlain;
    }

    return cleanedHtml.length > 0 ? cleanedHtml : cleanedPlain;
  }

  // Strip html markup while preserving link targets and structural linebreaks
  static cleanHtml(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
      .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '$2 [Link: $1] ')
      .replace(/<(?:br|p|div|tr|h[1-6]|li)[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&euro;/gi, '€')
      .replace(/&pound;/gi, '£');
  }

  // Normalize whitespace and remove zero width characters
  static cleanText(text: string): string {
    return text
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n+/g, '\n\n')
      .trim();
  }
}
