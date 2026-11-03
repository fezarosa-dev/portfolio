"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QueueForm } from "@/components/admin/queue-form";
import { useChanges } from "@/components/admin/changes-provider";
import {
  overlayClients,
  overlayCompanies,
  touchedIds,
} from "@/lib/changes/overlay";
import type { CompanyData } from "@/lib/changes/types";
import type { Company, CompanyClient } from "@/lib/supabase/queries";

const dataFrom = (formData: FormData): CompanyData | null => {
  const text = (name: string) =>
    String(formData.get(name) ?? "").trim() || null;
  const data = {
    name: text("name"),
    name_en: text("name_en"),
    url: text("url"),
  };
  return data.name || data.name_en ? data : null;
};

const labelOf = (c: { name: string | null; name_en: string | null }) =>
  c.name ?? c.name_en ?? "sem nome";

// grupos de clientes de uma empresa: renomear, remover e criar, tudo pela fila
function ClientGroups({
  company,
  clients,
}: {
  company: Company;
  clients: CompanyClient[];
}) {
  const { changes, enqueue } = useChanges();
  const touched = useMemo(() => touchedIds(changes, "client"), [changes]);
  const nameOf = (fd: FormData) => String(fd.get("name") ?? "").trim();
  return (
    <div className="mt-2 flex flex-col gap-1.5 border-l-2 border-muted pl-3">
      <p className="text-xs text-muted-foreground">
        Grupos de clientes ({clients.length})
      </p>
      {clients.map((group) => (
        <div
          key={group.id}
          className={`flex items-center gap-2 rounded px-1 ${touched.has(group.id) ? "outline outline-1 outline-orange-500" : ""}`}
        >
          <QueueForm
            key={group.name}
            className="flex flex-1 gap-2"
            onSubmit={(fd) => {
              const name = nameOf(fd);
              if (name)
                enqueue(
                  {
                    type: "client.update",
                    id: group.id,
                    data: { company_id: company.id, name },
                  },
                  `Grupo “${group.name}”: renomear`,
                );
            }}
          >
            <Input
              name="name"
              defaultValue={group.name}
              className="h-7 text-xs"
              aria-label="Nome do grupo"
            />
            <Button type="submit" variant="outline" size="sm" className="h-7">
              Salvar
            </Button>
          </QueueForm>
          <button
            type="button"
            onClick={() =>
              enqueue(
                { type: "client.remove", id: group.id },
                `Grupo “${group.name}”: remover`,
              )
            }
            aria-label={`Remover grupo ${group.name}`}
            className="px-1 text-muted-foreground hover:text-destructive"
          >
            ×
          </button>
        </div>
      ))}
      <QueueForm
        resetOnSubmit
        className="flex gap-2"
        onSubmit={(fd) => {
          const name = nameOf(fd);
          if (name)
            enqueue(
              {
                type: "client.add",
                id: crypto.randomUUID(),
                data: { company_id: company.id, name },
              },
              `Novo grupo “${name}” em ${labelOf(company)}`,
            );
        }}
      >
        <Input
          name="name"
          placeholder="Novo grupo (ex.: Cliente A)"
          className="h-7 text-xs"
        />
        <Button type="submit" variant="outline" size="sm" className="h-7">
          Adicionar
        </Button>
      </QueueForm>
    </div>
  );
}

export function CompaniesAdmin({
  companies,
  clients,
}: {
  companies: Company[];
  clients: CompanyClient[];
}) {
  const { changes, enqueue } = useChanges();
  const list = useMemo(
    () => overlayCompanies(companies, changes),
    [companies, changes],
  );
  const groups = useMemo(
    () => overlayClients(clients, changes),
    [clients, changes],
  );
  const touched = useMemo(() => touchedIds(changes, "company"), [changes]);

  return (
    <>
      <QueueForm
        resetOnSubmit
        className="mb-8 flex max-w-sm flex-wrap gap-2"
        onSubmit={(fd) => {
          const data = dataFrom(fd);
          if (data)
            enqueue(
              { type: "company.add", id: crypto.randomUUID(), data },
              `Nova empresa “${labelOf(data)}”`,
            );
        }}
      >
        <Input name="name" placeholder="Nome (PT)" />
        <Input name="name_en" placeholder="Nome (EN)" />
        <Input name="url" placeholder="Link (site da empresa...)" />
        <Button type="submit">Adicionar</Button>
      </QueueForm>

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma empresa ainda.</p>
      ) : (
        <ul className="flex max-w-md flex-col gap-2">
          {list.map((company) => (
            <li
              key={company.id}
              className={`rounded-md border px-3 py-2 ${touched.has(company.id) ? "border-orange-500" : ""}`}
            >
              <div className="flex items-center gap-2">
                <QueueForm
                  key={`${company.name ?? ""}|${company.name_en ?? ""}|${company.url ?? ""}`}
                  className="flex flex-1 flex-wrap gap-2"
                  onSubmit={(fd) => {
                    const data = dataFrom(fd);
                    if (data)
                      enqueue(
                        { type: "company.update", id: company.id, data },
                        `Empresa “${labelOf(company)}”: editar`,
                      );
                  }}
                >
                  <Input
                    name="name"
                    defaultValue={company.name ?? ""}
                    placeholder="Nome (PT)"
                    className="h-8"
                  />
                  <Input
                    name="name_en"
                    defaultValue={company.name_en ?? ""}
                    placeholder="Nome (EN)"
                    className="h-8"
                  />
                  <Input
                    name="url"
                    defaultValue={company.url ?? ""}
                    placeholder="Link (site da empresa...)"
                    className="h-8"
                  />
                  <Button type="submit" variant="outline" size="sm">
                    Salvar
                  </Button>
                </QueueForm>
                <button
                  type="button"
                  onClick={() =>
                    enqueue(
                      { type: "company.remove", id: company.id },
                      `Empresa “${labelOf(company)}”: remover`,
                    )
                  }
                  aria-label="Remover"
                  className="px-1 text-muted-foreground hover:text-destructive"
                >
                  ×
                </button>
              </div>
              <ClientGroups
                company={company}
                clients={groups.filter((g) => g.company_id === company.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
