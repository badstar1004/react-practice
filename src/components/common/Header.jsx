/**
 * Header.jsx
 *
 * 그리드 섹션 헤더 (제목, 건수, 버튼) + children(그리드 본문)
 */

import React from "react";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "i18n/keys";
import "./Header.css";

const Header = ({ title, count, buttons, children }) => {
  const { t } = useTranslation();

  return (
    <section className="grid-section">
      <div className="grid-section__toolbar">
        <div className="grid-section__left">
          <h2 className="grid-section__title">{title}</h2>

          {count !== undefined && count !== null && (
            <span className="grid-section__count">
              {t(I18N_KEYS.ROW_COUNT, "{{count}}건", { count })}
            </span>
          )}
        </div>

        <div className="grid-section__right">{buttons}</div>
      </div>

      <div className="grid-section__body">{children}</div>
    </section>
  );
};

export default Header;
