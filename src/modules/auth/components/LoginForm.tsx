import { IAuthLogin } from "@app/core/types/auth.types";
import {
  createValidationSchema,
  FieldConfig,
  ITButton,
  ITFormBuilder,
} from "@axzydev/axzy_ui_system";
import { Form, Formik } from "formik";

import { useState } from "react";
import { FaLock, FaLockOpen, FaUserAlt } from "react-icons/fa";
import * as Yup from "yup";

const LoginFormComponent = ({
  onSubmit,
  loading = false,
}: {
  onSubmit: (values: IAuthLogin) => void;
  loading?: boolean;
}) => {
  const initialValues = {
    username: "",
    password: "",
  };

  const [showPassword, setShowPassword] = useState(false);

  const fields: FieldConfig[] = [
    {
      name: "username",
      label: "Usuario",
      type: "text",
      required: true,
      column: 12,
      minLength: 3,
      maxLength: 20,
      validation: Yup.string()
        .required("Este campo es requerido"),
      rightIcon: <FaUserAlt />,
    },
    {
      name: "password",
      label: "Contraseña",
      type: showPassword ? "text" : "password",
      required: true,
      minLength: 4,
      maxLength: 20,
      column: 12,
      validation: Yup.string().required("Este campo es requerido"),
      rightIcon: !showPassword ? (
        <FaLock onClick={() => setShowPassword(!showPassword)} />
      ) : (
        <FaLockOpen onClick={() => setShowPassword(!showPassword)} />
      ),
    },
  ];

  return (
    <Formik
      initialValues={initialValues}
      validateOnMount
      validationSchema={createValidationSchema(fields)}
      onSubmit={onSubmit}
    >
      {({
        handleSubmit,
        values,
        touched,
        errors,
        handleChange,
        handleBlur,
        isValid,
      }) => (
        <Form onSubmit={handleSubmit} className="w-full">
          <ITFormBuilder
            fields={fields}
            columns={2}
            handleChange={handleChange}
            handleBlur={handleBlur}
            values={values}
            touched={touched}
            errors={errors}
          />
          <div className="mt-8">
            <ITButton 
              disabled={!isValid || loading} 
              className={`w-full !h-14 !rounded-2xl font-bold text-lg shadow-lg shadow-emerald-200 transition-all ${!isValid || loading ? 'opacity-50' : 'hover:scale-[1.02] active:scale-95 bg-emerald-600 hover:bg-emerald-700'}`} 
              type="submit"
            >
              <div className="flex items-center justify-center gap-3">
                {loading ? (
                   <span className="flex items-center gap-2">
                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     Autenticando...
                   </span>
                ) : (
                  "Entrar al Sistema"
                )}
              </div>
            </ITButton>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default LoginFormComponent;
