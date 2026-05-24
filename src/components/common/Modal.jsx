/**
 * Modal.jsx
 *
 * 상세보기 등 팝업용 공통 모달
 */

import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "i18n/keys";
import "./Modal.css";

/**
 * @param {boolean} open - 모달 표시 여부
 * @param {string} title - 헤더 제목
 * @param {Function} onClose - 닫기 콜백
 */
const Modal = ({ open, title, wide, bodyClassName, onClose, children }) => {
  const { t } = useTranslation();

  // ESC 키로 닫기
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && onClose) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={wide ? "modal-panel modal-panel--wide" : "modal-panel"}
        role="dialog"
        aria-modal="true"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <div className="modal-panel__header">
          <h3 className="modal-panel__title">{title}</h3>

          <button
            type="button"
            className="modal-panel__close"
            aria-label={t(I18N_KEYS.CLOSE, "닫기")}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className={`modal-panel__body ${bodyClassName || ""}`.trim()}>
          {children}
        </div>

        <div className="modal-panel__footer">
          <button type="button" className="btn btn-gray" onClick={onClose}>
            {t(I18N_KEYS.CLOSE, "닫기")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
