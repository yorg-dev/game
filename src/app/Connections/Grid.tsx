import {
  RecordContextProvider,
  useCreatePath,
  useListContext,
  useRecordContext,
  useTranslate,
} from "ra-core";
import { Link } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

const ListItem = () => {
  const record = useRecordContext();
  const createPath = useCreatePath();
  const translate = useTranslate();
  if (!record) return null;
  const to = createPath({
    resource: "connections",
    type: "edit",
    id: record.id,
  });

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-0">
        <Button
          asChild
          variant="ghost"
          className="w-full h-auto px-4 py-3 flex items-center justify-between rounded-lg">
          <Link
            to={to}
            aria-label={translate(
              "blaq.connections.accessibility.view_connection_details",
              { name: record.name },
            )}>
            <span className="text-sm font-medium">
              {record.name}
              {record.active === false
                ? ` (${translate("blaq.common.status.inactive")})`
                : ""}
            </span>
            <ChevronRight
              aria-hidden="true"
              className="h-4 w-4 text-muted-foreground"
            />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

const ConnectionGrid = () => {
  const { data, error, isPending } = useListContext();
  const translate = useTranslate();

  if (isPending) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">
          {translate("blaq.connections.states.loading")}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-destructive">
          {translate("blaq.connections.states.error")}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-muted/20">
        <p className="text-muted-foreground mb-4">
          {translate("blaq.connections.states.empty")}
        </p>
        <p className="text-sm text-muted-foreground">
          {translate("blaq.connections.states.empty_description")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {data.map((record) => (
        <RecordContextProvider key={record.id} value={record}>
          <ListItem />
        </RecordContextProvider>
      ))}
    </div>
  );
};

export default ConnectionGrid;
