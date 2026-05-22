/**
 * Form.jsx
 *
 * form 래퍼 — FormItem 값을 모아 onValueChange(changeValue, allValue) 호출
 */

import React, { createContext, useContext } from "react";

const FormContext = createContext(null);

export function useFormContext() {
  return useContext(FormContext);
}

const Form = ({
  values,
  onValueChange,
  onSubmit,
  className,
  disabled,
  children,
}) => {
  const handleFieldChange = (name, value) => {
    if (!onValueChange) {
      return;
    }

    const changeValue = { name, value };
    const allValue = {
      ...values,
      [name]: value,
    };

    onValueChange(changeValue, allValue);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (onSubmit) {
      onSubmit(event);
    }
  };

  return (
    <FormContext.Provider
      value={{
        values: values || {},
        onFieldChange: handleFieldChange,
        disabled,
      }}
    >
      <form className={className} onSubmit={handleSubmit}>
        {children}
      </form>
    </FormContext.Provider>
  );
};

export default Form;
