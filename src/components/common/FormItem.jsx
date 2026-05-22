/**
 * FormItem.jsx
 *
 * Form 하위 필드 — value/onChange는 Form Context에서 연결
 */

import React from "react";

import { useFormContext } from "./Form";

const FormItem = ({
  label,
  name,
  value,
  onChange,
  disabled,
  className,
  children,
}) => {
  const formContext = useFormContext();
  const child = React.Children.only(children);
  const isCheckbox = child.props && child.props.type === "checkbox";

  const fieldValue =
    formContext && formContext.values
      ? formContext.values[name]
      : value;

  const fieldDisabled =
    disabled !== undefined && disabled !== null
      ? disabled
      : formContext
        ? formContext.disabled
        : disabled;

  const handleChange = (event) => {
    const nextValue = isCheckbox ? event.target.checked : event.target.value;

    if (formContext && formContext.onFieldChange) {
      formContext.onFieldChange(name, nextValue);
      return;
    }

    if (onChange) {
      onChange(name, nextValue);
    }
  };

  const controlProps = {
    id: name,
    name: name,
    disabled: fieldDisabled,
    onChange: handleChange,
  };

  if (isCheckbox) {
    controlProps.checked = Boolean(fieldValue);

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
    fieldValue === null || fieldValue === undefined ? "" : fieldValue;

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
