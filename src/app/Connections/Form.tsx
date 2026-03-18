import { required } from "ra-core";
import {
  BooleanInput,
  SimpleForm,
  TextInput,
  ReferenceInput,
  AutocompleteInput,
  FormToolbar,
  CancelButton,
  SaveButton,
  DeleteButton,
} from "@/components/admin";

const validate = [required()];

interface Props {
  defaultValues?: object;
  mode: "create" | "edit";
}

/*
          {mode === "edit" && (
            <>
              <ReferenceField
                label={false}
                link={false}
                reference="apps"
                source="app_id">
                <Logo source="logo" />
              </ReferenceField>
            </>
          )}
*/

const ConnectionForm = ({ defaultValues, mode }: Props) => {
  const toolbar = (
    <FormToolbar>
      <div className="flex flex-row gap-2 justify-between w-full">
        {mode === "edit" && (
          <DeleteButton
            variant="ghost"
            className="cursor-pointer text-destructive hover:text-destructive"
          />
        )}
        <div className="flex flex-row gap-2 ml-auto">
          <CancelButton />
          <SaveButton />
        </div>
      </div>
    </FormToolbar>
  );

  return (
    <SimpleForm defaultValues={defaultValues} toolbar={toolbar}>
      <TextInput
        helperText="blaq.connections.controls.name.helper_text"
        label="blaq.connections.controls.name.label"
        source="name"
        validate={validate}
      />
      <ReferenceInput
        label="blaq.connections.controls.application.label"
        source="app_id"
        reference="apps"
        sort={{ field: "name", order: "ASC" }}
        perPage={1000}>
        <AutocompleteInput
          optionText="name"
          validate={validate}
          helperText="blaq.connections.controls.application.helper_text"
        />
      </ReferenceInput>

      <BooleanInput
        helperText="blaq.connections.controls.active.helper_text"
        label="blaq.connections.controls.active.label"
        source="active"
      />
    </SimpleForm>
  );
};

export default ConnectionForm;
