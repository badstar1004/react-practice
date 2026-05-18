import React from "react";
import "./Header.css";

const Header = ({ title, count, buttons, children }) => {
  return (
    <section className="grid-section">
      <div className="grid-section__header">
        <div className="grid-section__left">
          <h2 className="grid-section__title">{title}</h2>

          {count !== undefined && count !== null && (
            <span className="grid-section__count">총 {count}건</span>
          )}
        </div>
        <div className="grid-section__right">{buttons}</div>
        <div className="grid-section__body">{children}</div>
      </div>
    </section>
  );
};

export default Header;
