import { Edit } from "@/components/admin";
import { useTranslate } from "ra-core";

import Form from "./Form";

const ConnectionEdit = () => {
  const translate = useTranslate();

  return (
    <Edit
      title={translate("blaq.connections.actions.edit_title")}
      actions={false}>
      <Form mode="edit" />
    </Edit>
  );
};

export default ConnectionEdit;
