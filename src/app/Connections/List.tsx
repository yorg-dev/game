import { List, ListPagination } from "@/components/admin";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "react-router";
import { Plus } from "lucide-react";
import { useTranslate } from "ra-core";
import ConnectionGrid from "./Grid";

const ListActions = () => {
  const translate = useTranslate();
  return (
    <div className="flex items-center gap-2">
      <Link
        className={buttonVariants({ variant: "outline" })}
        to="/connections/create">
        <Plus aria-hidden="true" />
        {translate("blaq.connections.actions.create")}
      </Link>
    </div>
  );
};

const ConnectionList = () => {
  return (
    <List
      actions={<ListActions />}
      exporter={false}
      pagination={<ListPagination />}>
      <ConnectionGrid />
    </List>
  );
};

export default ConnectionList;
