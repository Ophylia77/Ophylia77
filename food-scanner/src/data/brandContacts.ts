/**
 * Brand → consumer-relations email directory used to pre-fill the "To" field
 * of the call-out email.
 *
 * Keys are normalised brand names (see `normalizeBrand`). Only add addresses
 * that you have verified on the brand's official website – many companies
 * route consumer feedback through web forms and change addresses over time.
 *
 * Emails users enter in the app are saved on their device and take priority,
 * so the directory grows as people use the app.
 *
 * Example:
 *   'example foods': 'consumercare@examplefoods.com',
 */
export const BRAND_CONTACTS: Record<string, string> = {};
