/**
 * Row.jsx
 *
 * 24칸 그리드 행
 */

import React from "react";

import "./gridForm.css";

const Row = ({ className, children }) => {
  const rowClassName = className
    ? `grid-form-row ${className}`
    : "grid-form-row";

  return <div className={rowClassName}>{children}</div>;
};

export default Row;
