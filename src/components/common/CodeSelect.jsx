/**
 * CodeSelect.jsx
 *
 * 공통 코드 선택 (select)
 */

import React from "react";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "i18n/keys";

function CodeSelect(props) {
  const { t } = useTranslation();
  const { value, options, onChange, placeholder, disabled, name, className } =
    props;

  const optionList = options || [];
  const emptyLabel =
    placeholder || t(I18N_KEYS.SELECT_DEFAULT, "선택하세요.");

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
      <option value="">{emptyLabel}</option>

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
