import React from "react";
import "./IssueSearchBox.css";

const IssueSearchBox = ({
  searchCondition,
  statusOptions,
  priorityOptions,
  onlyUnsetUsage,
  onChangeSearchCondition,
  onChangeOnlyUnsetUsage,
  onSearch,
  onReset,
  disabled,
}) => {
  return (
    <section className="issue-search-box">
      <div className="issue-search-box__row">
        <div className="search-field">
          <label className="search-field__label">상태</label>

          <select
            className="search-field__control"
            value={searchCondition.statusCode}
            onChange={(event) => {
              onChangeSearchCondition("statusCode", event.target.value);
            }}
            disabled={disabled}
          >
            <option value="">전체</option>

            {statusOptions.map((option) => {
              return (
                <option key={option.code} value={option.code}>
                  {option.name}
                </option>
              );
            })}
          </select>
        </div>

        <div className="search-field">
          <label className="search-field__label">우선순위</label>

          <select
            className="search-field__control"
            value={searchCondition.priorityCode}
            onChange={(event) => {
              onChangeSearchCondition("priorityCode", event.target.value);
            }}
            disabled={disabled}
          >
            <option value="">전체</option>

            {priorityOptions.map((option) => {
              return (
                <option key={option.code} value={option.code}>
                  {option.name}
                </option>
              );
            })}
          </select>
        </div>

        <div className="search-field search-field--keyword">
          <label className="search-field__label">검색어</label>

          <input
            type="text"
            className="search-field__control"
            value={searchCondition.keyword}
            onChange={(event) => {
              onChangeSearchCondition("keyword", event.target.value);
            }}
            placeholder="제목을 입력하세요"
            disabled={disabled}
          />
        </div>

        <div className="search-field">
          <label className="search-field__label">시작일</label>

          <input
            type="date"
            className="search-field__control"
            value={searchCondition.startDate}
            onChange={(event) => {
              onChangeSearchCondition("startDate", event.target.value);
            }}
            disabled={disabled}
          />
        </div>

        <div className="search-field">
          <label className="search-field__label">종료일</label>

          <input
            type="date"
            className="search-field__control"
            value={searchCondition.endDate}
            onChange={(event) => {
              onChangeSearchCondition("endDate", event.target.value);
            }}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="issue-search-box__bottom">
        <label className="issue-search-box__checkbox">
          <input
            type="checkbox"
            checked={onlyUnsetUsage}
            onChange={onChangeOnlyUnsetUsage}
            disabled={disabled}
          />
          <span>용도 미설정만 보기</span>
        </label>

        <div className="issue-search-box__buttons">
          <button
            type="button"
            className="btn btn-gray"
            onClick={onReset}
            disabled={disabled}
          >
            초기화
          </button>

          <button
            type="button"
            className="btn btn-blue"
            onClick={onSearch}
            disabled={disabled}
          >
            조회
          </button>
        </div>
      </div>
    </section>
  );
};

export default IssueSearchBox;
