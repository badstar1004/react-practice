/**
 * FormItem.jsx
 *
 * 조회 form 필드 래퍼 — label + control
 * children에 input/select를 넣고 value, onChange(name, value)로 form item과 연결
 */

import React from "react";

const FormItem = ({
  label,
  name,
  value,
  onChange,
  disabled,
  className,
  children,
}) => {
  const child = React.Children.only(children);
  const isCheckbox = child.props && child.props.type === "checkbox";

  const handleChange = (event) => {
    if (!onChange) {
      return;
    }

    const nextValue = isCheckbox ? event.target.checked : event.target.value;

    onChange(name, nextValue);
  };

  const controlProps = {
    id: name,
    name: name,
    disabled: disabled,
    onChange: handleChange,
  };

  if (isCheckbox) {
    controlProps.checked = Boolean(value);

    return (
      <label
        className={className || "search-field search-field--checkbox"}
      >
        {React.cloneElement(child, controlProps)}
        {label ? <span className="search-field__checkbox-label">{label}</span> : null}
      </label>
    );
  }

  controlProps.value =
    value === null || value === undefined ? "" : value;

  return (
    <div className={className || "search-field"}>
      <label className="search-field__label" htmlFor={name}>
        {label}
      </label>
      {React.cloneElement(child, controlProps)}
    </div>
  );
};

export default FormItem;
