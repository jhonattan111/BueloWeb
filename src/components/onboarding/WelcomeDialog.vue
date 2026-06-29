<script setup lang="ts">
import { Sparkles, Table2, Users, FileCode, Braces } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

defineProps<{ open: boolean; isCreating?: boolean; error?: string | null }>();

const emit = defineEmits<{
  create: [];
  dismiss: [];
}>();

const items = [
  {
    icon: Table2,
    title: "fatura.report.yml",
    desc: "Fatura declarativa — tabela com total agregado e formatação de moeda/CNPJ.",
  },
  {
    icon: Users,
    title: "colaboradores.report.yml",
    desc: "Agrupamento por departamento com subtotais (groupBy + soma).",
  },
  {
    icon: FileCode,
    title: "carta.cs",
    desc: "Relatório em C# (QuestPDF) — o caminho de poder total.",
  },
  {
    icon: Braces,
    title: "dados + script",
    desc: "JSONs de dados de cada relatório e um script auxiliar (.csx).",
  },
];
</script>

<template>
  <Dialog
    :open="open"
    @update:open="(v: boolean) => { if (!v) emit('dismiss'); }"
  >
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Sparkles class="size-4 text-primary" />
          Bem-vindo ao Buelo
        </DialogTitle>
        <DialogDescription>
          Quer começar com alguns relatórios de exemplo? Eles mostram os recursos do
          produto e já renderizam — é só abrir e clicar em Render.
        </DialogDescription>
      </DialogHeader>

      <div class="py-1">
        <p class="text-xs text-muted-foreground mb-2">
          Serão criados na pasta <code>exemplos/</code>:
        </p>
        <ul class="space-y-2.5">
          <li v-for="item in items" :key="item.title" class="flex items-start gap-2.5">
            <component :is="item.icon" class="size-4 mt-0.5 shrink-0 text-muted-foreground" />
            <div class="min-w-0">
              <p class="text-sm font-medium leading-tight">{{ item.title }}</p>
              <p class="text-xs text-muted-foreground">{{ item.desc }}</p>
            </div>
          </li>
        </ul>
      </div>

      <p v-if="error" class="text-xs text-destructive">{{ error }}</p>

      <DialogFooter>
        <Button variant="outline" :disabled="isCreating" @click="emit('dismiss')">
          Agora não
        </Button>
        <Button :disabled="isCreating" @click="emit('create')">
          {{ isCreating ? "Criando…" : "Criar exemplos" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
