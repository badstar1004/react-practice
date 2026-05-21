/**
 * Form.jsx
 *
 * form 래퍼
 */

import React from "react";

const Form = ({ onSubmit, className, children }) => {
  const handleSubmit = (event) => {
    event.preventDefault();

    if (onSubmit) {
      onSubmit(event);
    }
  };

  return (
    <form className={className} onSubmit={handleSubmit}>
      {children}
    </form>
  );
};

export default Form;
