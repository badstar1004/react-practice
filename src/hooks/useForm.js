/**
 * useForm.js
 *
 * Owner Code 조회조건 form state hook
 * rscOwnerCodeSearchForm.item 으로 검색/초기화
 */

import { useCallback, useState } from "react";

/** 조회조건 초기값 (초기화 버튼·최초 조회에 사용) */
export const OWNER_CODE_SEARCH_INITIAL_ITEM = {
  ownerCd: "",
  usageCd: "",
  noUsage: false,
};

/**
 * 화면 조회조건 form hook
 *
 * rscOwnerCodeSearchForm.item 으로 조회/초기화/검색에 사용합니다.
 */
export function useForm() {
  const [rscOwnerCodeSearchForm, setRscOwnerCodeSearchForm] = useState({
    item: { ...OWNER_CODE_SEARCH_INITIAL_ITEM },
    initialItem: { ...OWNER_CODE_SEARCH_INITIAL_ITEM },
  });

  const setSearchFormField = useCallback((name, value) => {
    setRscOwnerCodeSearchForm((prev) => {
      return {
        ...prev,
        item: {
          ...prev.item,
          [name]: value,
        },
      };
    });
  }, []);

  const resetSearchForm = useCallback(() => {
    setRscOwnerCodeSearchForm((prev) => {
      return {
        ...prev,
        item: { ...prev.initialItem },
      };
    });
  }, []);

  return {
    rscOwnerCodeSearchForm,
    setSearchFormField,
    resetSearchForm,
  };
}
