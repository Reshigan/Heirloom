CREATE TYPE "Visibility" AS ENUM ('PRIVATE', 'POSTHUMOUS');

CREATE TYPE "Relation" AS ENUM ('self', 'father', 'mother', 'son', 'daughter', 'spouse', 'sibling', 'grandparent', 'grandchild', 'aunt_uncle', 'cousin', 'friend', 'other');

ALTER TABLE "vault_items" ADD COLUMN "sentiment_label" TEXT;
ALTER TABLE "vault_items" ADD COLUMN "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE';

CREATE TABLE "people" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relation" "Relation" NOT NULL,
    "birth_date" TIMESTAMP(3),
    "death_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "memory_people" (
    "memory_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "memory_people_pkey" PRIMARY KEY ("memory_id","person_id")
);

CREATE TABLE "legacy_policies" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "rules" JSONB NOT NULL,
    "grace_period_days" INTEGER NOT NULL DEFAULT 14,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legacy_policies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "people_owner_id_idx" ON "people"("owner_id");
CREATE INDEX "people_owner_id_relation_idx" ON "people"("owner_id", "relation");
CREATE INDEX "memory_people_person_id_idx" ON "memory_people"("person_id");
CREATE UNIQUE INDEX "legacy_policies_owner_id_key" ON "legacy_policies"("owner_id");
CREATE INDEX "vault_items_visibility_idx" ON "vault_items"("visibility");
CREATE INDEX "vault_items_sentiment_label_idx" ON "vault_items"("sentiment_label");

ALTER TABLE "people" ADD CONSTRAINT "people_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "memory_people" ADD CONSTRAINT "memory_people_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "vault_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "memory_people" ADD CONSTRAINT "memory_people_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "legacy_policies" ADD CONSTRAINT "legacy_policies_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
