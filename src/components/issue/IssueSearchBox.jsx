import React from "react";

import FormItem from "components/common/FormItem";
import CodeSelect from "components/common/CodeSelect";

import "./IssueSearchBox.css";

const IssueSearchBox = ({
  rscOwnerCodeSearchForm,
  usageOptions,
  onChangeSearchField,
  onReset,
  onSearch,
  disabled,
}) => {
  const { item } = rscOwnerCodeSearchForm;

  const handleSubmit = (event) => {
    event.preventDefault();

    if (onSearch) {
      onSearch();
    }
  };

  const handleUsageChange = (value) => {
    onChangeSearchField("usageCd", value);
  };

  return (
    <section className="issue-search-box">
      <div className="issue-search-box__title">조회조건</div>

      <form className="issue-search-box__form" onSubmit={handleSubmit}>
        <div className="issue-search-box__row">
          <FormItem
            label="owner code"
            name="ownerCd"
            value={item.ownerCd}
            onChange={onChangeSearchField}
            disabled={disabled}
          >
            <input
              type="text"
              className="search-field__control"
              placeholder="owner code"
            />
          </FormItem>

          <div className="search-field">
            <label className="search-field__label" htmlFor="usageCd">
              용도
            </label>
            <CodeSelect
              name="usageCd"
              value={item.usageCd}
              options={usageOptions}
              placeholder="용도를(을) 선택하세요"
              onChange={handleUsageChange}
              disabled={disabled}
              className="search-field__control search-field__control--select"
            />
          </div>

          <FormItem
            label="용도없음"
            name="noUsage"
            value={item.noUsage}
            onChange={onChangeSearchField}
            disabled={disabled}
            className="search-field search-field--checkbox"
          >
            <input type="checkbox" />
          </FormItem>

          <div className="issue-search-box__buttons">
            <button
              type="button"
              className="btn btn-gray"
              onClick={onReset}
              disabled={disabled}
            >
              초기화
            </button>

            <button type="submit" className="btn btn-blue" disabled={disabled}>
              검색
            </button>
          </div>
        </div>
      </form>
    </section>
  );
};

export default IssueSearchBox;
