/**
 * PageNotice.jsx
 *
 * 화면 상단 안내/검증/성공 메시지
 */

import React from "react";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "i18n/keys";
import "./PageNotice.css";

const PageNotice = ({ notice, onDismiss }) => {
  const { t } = useTranslation();

  if (!notice || !notice.message) {
    return null;
  }

  const typeClass =
    notice.type === "success"
      ? "page-notice--success"
      : notice.type === "error"
        ? "page-notice--error"
        : "page-notice--info";

  return (
    <div className={`page-notice ${typeClass}`} role="status">
      <span className="page-notice__message">{notice.message}</span>

      {onDismiss ? (
        <button
          type="button"
          className="page-notice__dismiss"
          onClick={onDismiss}
          aria-label={t(I18N_KEYS.CLOSE, "닫기")}
        >
          ×
        </button>
      ) : null}
    </div>
  );
};

export default PageNotice;
