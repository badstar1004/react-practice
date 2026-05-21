/**
 * issueSearchConditionModel.js
 *
 * 조회조건 UI·동작 정의 (model)
 */

import { I18N_KEYS } from "i18n/keys";

export const OWNER_CODE_SEARCH_INITIAL_ITEM = {
  ownerCd: "",
  usageCd: "",
  noUsage: false,
};

export const createSearchConditionModel = ({
  t,
  item,
  disabled,
  usageOptions,
  usageSelectPlaceholder,
  onFieldChange,
  onSubmit,
  onReset,
}) => {
  return {
    title: t(I18N_KEYS.SEARCH_CONDITION, "조회조건"),
    item,
    disabled,
    onFieldChange,
    onSubmit,
    fields: [
      {
        type: "text",
        name: "ownerCd",
        label: t(I18N_KEYS.OWNER_CODE, "owner code"),
        placeholder: t(
          I18N_KEYS.OWNER_CODE_PLACEHOLDER,
          "owner code (영문·숫자)",
        ),
      },
      {
        type: "select",
        name: "usageCd",
        label: t(I18N_KEYS.USAGE, "용도"),
        options: usageOptions,
        placeholder: usageSelectPlaceholder,
      },
      {
        type: "checkbox",
        name: "noUsage",
        label: t(I18N_KEYS.NO_USAGE, "용도없음"),
        className: "search-field search-field--checkbox",
      },
    ],
    buttons: {
      reset: {
        label: t(I18N_KEYS.RESET, "초기화"),
        onClick: onReset,
      },
      search: {
        label: t(I18N_KEYS.SEARCH, "검색"),
      },
    },
  };
};
