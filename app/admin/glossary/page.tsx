import type { Metadata } from "next";
import { PageHeader } from "@/components/blocks";
import { GlossaryManager } from "@/components/admin/glossary-manager";
import { requirePagePermission } from "@/lib/admin/access";
import { DEFINITION_MAX, KEYWORD_MAX, listGlossaryTerms } from "@/lib/glossary/glossary";

export const metadata: Metadata = { title: "Glossary" };

/** The words we explain in summaries, and what we say about each. */
export default async function AdminGlossaryPage() {
  await requirePagePermission("glossary.manage");
  const terms = await listGlossaryTerms();
  return (
    <>
      <PageHeader
        title="Glossary"
        description="Words in bill summaries that get underlined, and the plain explanation each one opens. A word can have more than one meaning, like an acronym. Changes show on the next page anyone opens."
      />
      <GlossaryManager
        terms={terms.map((term) => ({ id: term.id, keyword: term.keyword, definition: term.definition }))}
        keywordMax={KEYWORD_MAX}
        definitionMax={DEFINITION_MAX}
      />
    </>
  );
}
