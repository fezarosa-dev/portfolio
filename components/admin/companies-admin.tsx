"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QueueForm } from "@/components/admin/queue-form";
import { useChanges } from "@/components/admin/changes-provider";
import {
  overlayClients,
  overlayCompanies,
  overlayProjects,
  touchedIds,
} from "@/lib/changes/overlay";
import type { CompanyData } from "@/lib/changes/types";
import { clientBreakdown } from "@/lib/company-count";
import type { Company, CompanyClient, Project } from "@/lib/supabase/queries";

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

const titleOf = (p: Project) => p.title ?? p.title_en ?? "sem título";

// o número de empresas que o site mostra, explicado (já com as mudanças da fila ainda não enviadas)
function CountSummary({
  projects,
  companies,
  clients,
  pending,
}: {
  projects: Project[];
  companies: Company[];
  clients: CompanyClient[];
  pending: boolean;
}) {
  const report = clientBreakdown(projects, companies, clients);
  return (
    <section className="mb-8 max-w-2xl rounded-md border p-4">
      <p className="text-sm">
        No site: <strong className="text-lg">{report.total}</strong>{" "}
        {report.total === 1 ? "empresa" : "empresas"} atendidas
        {pending && (
          <span className="text-muted-foreground">
            {" "}
            (contando as mudanças ainda não enviadas)
          </span>
        )}
      </p>
      <ul className="mt-3 flex flex-col gap-1 text-xs">
        {report.units.map((u) => (
          <li key={u.key}>
            <span className="font-medium">{u.label}</span>{" "}
            <span className="text-muted-foreground">
              {u.kind === "group" ? `grupo em ${u.company}` : "empresa"} ·{" "}
              {u.projects.join(", ")}
            </span>
          </li>
        ))}
      </ul>
      {report.warnings.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1 text-xs text-orange-600 dark:text-orange-400">
          {report.warnings.map((w) => (
            <li key={w}>⚠ {w}</li>
          ))}
        </ul>
      )}
      {report.notCounted.length > 0 && (
        <details className="mt-3 text-xs text-muted-foreground">
          <summary>Fora da conta ({report.notCounted.length})</summary>
          <ul className="mt-1 flex flex-col gap-0.5">
            {report.notCounted.map((n) => (
              <li key={n.project}>
                {n.project}: {n.reason}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

// projetos de um grupo: tirar (×) ou trazer outro projeto da mesma empresa
function GroupProjects({
  group,
  projects,
}: {
  group: CompanyClient;
  projects: Project[];
}) {
  const { enqueue } = useChanges();
  const inGroup = projects.filter((p) => p.client_id === group.id);
  const others = projects.filter((p) => p.client_id !== group.id);
  return (
    <div className="mb-1 ml-1 flex flex-wrap items-center gap-1">
      {inGroup.map((p) => (
        <span
          key={p.id}
          className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[11px]"
        >
          {titleOf(p)}
          <button
            type="button"
            aria-label={`Tirar ${titleOf(p)} do grupo`}
            className="text-muted-foreground hover:text-destructive"
            onClick={() =>
              enqueue(
                { type: "project.client", id: p.id, client_id: null },
                `Projeto “${titleOf(p)}”: sair do grupo “${group.name}”`,
              )
            }
          >
            ×
          </button>
        </span>
      ))}
      {others.length > 0 && (
        <select
          aria-label={`Adicionar projeto ao grupo ${group.name}`}
          className="h-6 rounded border bg-background px-1 text-[11px]"
          value=""
          onChange={(e) => {
            const project = others.find((p) => p.id === e.target.value);
            if (project)
              enqueue(
                { type: "project.client", id: project.id, client_id: group.id },
                `Projeto “${titleOf(project)}”: grupo “${group.name}”`,
              );
          }}
        >
          <option value="">+ projeto…</option>
          {others.map((p) => (
            <option key={p.id} value={p.id}>
              {titleOf(p)}
            </option>
          ))}
        </select>
      )}
      {inGroup.length === 0 && (
        <span className="text-[11px] text-orange-600 dark:text-orange-400">
          sem projeto: não conta
        </span>
      )}
    </div>
  );
}

// grupos de clientes de uma empresa: renomear, remover e criar, tudo pela fila
function ClientGroups({
  company,
  clients,
  projects,
}: {
  company: Company;
  clients: CompanyClient[];
  projects: Project[];
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
        <div key={group.id}>
          <div
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
          <GroupProjects group={group} projects={projects} />
        </div>
      ))}
      {clients.length > 0 &&
        projects.some((p) => !clients.some((g) => g.id === p.client_id)) && (
          <p className="text-[11px] text-orange-600 dark:text-orange-400">
            Sem grupo (contam juntos como 1 cliente):{" "}
            {projects
              .filter((p) => !clients.some((g) => g.id === p.client_id))
              .map(titleOf)
              .join(", ")}
          </p>
        )}
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
  projects,
}: {
  companies: Company[];
  clients: CompanyClient[];
  projects: Project[];
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
  // projetos com a fila aplicada; grupo apagado na fila solta o projeto (o banco faz o mesmo)
  const work = useMemo(
    () =>
      overlayProjects(projects, changes, {
        languages: [],
        authors: [],
        companies: list,
      }).map((p) =>
        p.client_id && !groups.some((g) => g.id === p.client_id)
          ? { ...p, client_id: null }
          : p,
      ),
    [projects, changes, list, groups],
  );
  const touched = useMemo(() => touchedIds(changes, "company"), [changes]);

  return (
    <>
      <CountSummary
        projects={work}
        companies={list}
        clients={groups}
        pending={changes.length > 0}
      />
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
                projects={work.filter((p) => p.company?.id === company.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
