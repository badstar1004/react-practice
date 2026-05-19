/**
 * CodeSelect.jsx
 *
 * 공통 코드 선택 (select)
 * options: [{ code, name }]
 * onChange(value, event)
 */

import React from "react";

function CodeSelect(props) {
  const { value, options, onChange, placeholder, disabled, name, className } =
    props;

  const optionList = options || [];

  function handleChange(event) {
    if (onChange) {
      onChange(event.target.value, event);
    }
  }

  return (
    <select
      name={name}
      value={value || ""}
      onChange={handleChange}
      disabled={disabled}
      className={className}
      style={{ width: "100%", height: "100%" }}
    >
      <option value="">{placeholder || "선택하세요."}</option>

      {optionList.map(function (item) {
        return (
          <option key={item.code} value={item.code}>
            {item.name}
          </option>
        );
      })}
    </select>
  );
}

export default CodeSelect;
