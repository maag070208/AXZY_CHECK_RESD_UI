import { IAuthRegister } from "@app/core/types/auth.types";
import { ITButton, ITInput } from "@axzydev/axzy_ui_system";
import { Form, Formik } from "formik";
import * as Yup from "yup";

const validationSchema = Yup.object().shape({
  name: Yup.string().required("El nombre es requerido"),
  username: Yup.string().required("El usuario es requerido"),
  password: Yup.string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .required("La contraseña es requerida"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), undefined], 'Las contraseñas deben coincidir')
    .required('Confirmar la contraseña es requerido'),
});

interface RegisterFormProps {
  onSubmit: (values: IAuthRegister) => void;
}

const RegisterForm = ({ onSubmit }: RegisterFormProps) => {
  return (
    <Formik
      initialValues={{ name: "", username: "", password: "", confirmPassword: "", roleId: "GUARD_ROLE_ID" }}
      validationSchema={validationSchema}
      onSubmit={(values) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { confirmPassword, ...rest } = values;
        onSubmit(rest);
      }}
    >
      {({
        handleChange,
        handleBlur,
        values,
        errors,
        touched,
        isValid,
        dirty,
      }) => (
        <Form className="w-full flex justify-center items-center flex-col px-4 lg:px-6 space-y-4">
          <ITInput
            label="Nombre"
            name="name"
            value={values.name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.name && errors.name ? errors.name : undefined}
            placeholder="Ingrese nombre"
          />
          <ITInput
            label="Usuario"
            name="username"
            value={values.username}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.username && errors.username ? errors.username : undefined}
            placeholder="Ingrese usuario"
          />

          <ITInput
            label="Contraseña"
            name="password"
            type="password"
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.password && errors.password ? errors.password : undefined}
            placeholder="Ingrese contraseña"
          />

          <ITInput
            label="Confirmar Contraseña"
            name="confirmPassword"
            type="password"
            value={values.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.confirmPassword && errors.confirmPassword ? errors.confirmPassword : undefined}
            placeholder="Confirme contraseña"
          />

          <ITButton
            type="submit"
            label="Registrarse"
            disabled={!isValid || !dirty}
            variant="filled"
            color="primary"
            className="w-full"
          />
        </Form>
      )}
    </Formik>
  );
};

export default RegisterForm;
