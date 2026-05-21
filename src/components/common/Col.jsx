/**
 * Col.jsx
 *
 * span: 24분할 그리드 열 너비 (기본 24 = 한 줄 전체)
 */

import React from "react";

import "./gridForm.css";

const Col = ({ span = 24, className, children }) => {
  const colClassName = className ? `grid-form-col ${className}` : "grid-form-col";

  return (
    <div className={colClassName} style={{ gridColumn: `span ${span}` }}>
      {children}
    </div>
  );
};

export default Col;
