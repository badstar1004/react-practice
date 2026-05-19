import React from "react";

/**
 * form 조회조건 한 필드를 감싸는 컴포넌트
 *
 * value / onChange(name, value) 로 부모 form item 과 연결합니다.
 */
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
