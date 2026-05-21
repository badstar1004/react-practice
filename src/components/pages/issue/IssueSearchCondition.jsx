/**
 * IssueSearchCondition.jsx
 *
 * 조회조건 영역 — model 기반 렌더링
 */

import React from "react";

import FormItem from "components/common/FormItem";
import CodeSelect from "components/common/CodeSelect";

const renderField = (field, model) => {
  const { item, disabled, onFieldChange } = model;
  const value = item[field.name];

  if (field.type === "text") {
    return (
      <FormItem
        key={field.name}
        label={field.label}
        name={field.name}
        value={value}
        onChange={onFieldChange}
        disabled={disabled}
      >
        <input
          type="text"
          className="search-field__control"
          placeholder={field.placeholder}
        />
      </FormItem>
    );
  }

  if (field.type === "select") {
    return (
      <div key={field.name} className="search-field">
        <label className="search-field__label" htmlFor={field.name}>
          {field.label}
        </label>
        <CodeSelect
          name={field.name}
          value={value}
          options={field.options}
          placeholder={field.placeholder}
          onChange={(nextValue) => {
            onFieldChange(field.name, nextValue);
          }}
          disabled={disabled}
          className="search-field__control search-field__control--select"
        />
      </div>
    );
  }

  if (field.type === "checkbox") {
    return (
      <FormItem
        key={field.name}
        label={field.label}
        name={field.name}
        value={value}
        onChange={onFieldChange}
        disabled={disabled}
        className={field.className}
      >
        <input type="checkbox" />
      </FormItem>
    );
  }

  return null;
};

const IssueSearchCondition = ({ model }) => {
  if (!model) {
    return null;
  }

  const { title, disabled, fields, buttons, onSubmit } = model;

  return (
    <section className="issue-search-box">
      <div className="issue-search-box__title">{title}</div>

      <form className="issue-search-box__form" onSubmit={onSubmit}>
        <div className="issue-search-box__row">
          {fields.map((field) => {
            return renderField(field, model);
          })}

          <div className="issue-search-box__buttons">
            <button
              type="button"
              className="btn btn-gray"
              onClick={buttons.reset.onClick}
              disabled={disabled}
            >
              {buttons.reset.label}
            </button>

            <button
              type="submit"
              className="btn btn-blue"
              disabled={disabled}
            >
              {buttons.search.label}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
};

export default IssueSearchCondition;
