/**
 * @deprecated This file is deprecated. Use functions from ./service directly.
 */

import {
  sendActivityNotification,
  sendFamilyLink,
  sendFlaggedContent,
  sendParentalConsent,
  sendWeeklyReport,
  sendParentalAlert,
} from "./service";

/**
 * @deprecated Use sendFamilyLink from ./service instead
 */
export const sendFamilyLinkEmail = sendFamilyLink;

/**
 * @deprecated Use sendParentalConsent from ./service instead
 */
export const sendParentalConsentEmail = sendParentalConsent;

/**
 * @deprecated Use sendActivityNotification from ./service instead
 */
export const sendActivityNotificationEmail = sendActivityNotification;

/**
 * @deprecated Use sendFlaggedContent from ./service instead
 */
export const sendFlaggedContentEmail = sendFlaggedContent;

/**
 * @deprecated Use sendWeeklyReport from ./service instead
 */
export const sendWeeklyReportEmail = sendWeeklyReport;

/**
 * @deprecated Use sendParentalAlert from ./service instead
 */
export const sendParentalAlertEmail = sendParentalAlert;
