import React, { useEffect, useMemo, useState } from 'react';
import { db } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, FileText, PenLine, ArrowLeft, ShieldCheck } from 'lucide-react';
import { INTAKE_DOCS } from './intakeTemplates';

/**
 * IntakePacket — the read → agree → sign flow for a resident.
 * Generates one rr_intake_documents row per template (pre-filled from carry-over)
 * the first time it opens, then lets the resident work through each one.
 */
export default function IntakePacket({ open, onOpenChange, resident, carryOver, onComplete }) {
  const qc = useQueryClient();
  const [activeType, setActiveType] = useState(null);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['rr_intake', resident?.id],
    queryFn: () => db.entities.RrIntakeDocument.filter({ resident_id: resident.id }, 'created_date'),
    enabled: Boolean(open && resident?.id),
  });

  // First open with no docs yet → generate the packet, pre-filled from carry-over.
  const generate = useMutation({
    mutationFn: async () => {
      const rows = INTAKE_DOCS.map((tpl) => {
        const data = {};
        tpl.fields.forEach((f) => {
          if (f.from && carryOver?.[f.from] != null) data[f.key] = carryOver[f.from];
        });
        return {
          resident_id: resident.id,
          participant_id: resident.participant_id,
          house_id: resident.house_id,
          doc_type: tpl.type,
          title: tpl.title,
          status: 'pending',
          data,
          agreed: false,
        };
      });
      return db.entities.RrIntakeDocument.bulkCreate(rows);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rr_intake', resident?.id] }),
  });

  useEffect(() => {
    if (open && !isLoading && resident?.id && docs.length === 0 && !generate.isPending) {
      generate.mutate();
    }
  }, [open, isLoading, docs.length, resident?.id]); // eslint-disable-line

  const byType = useMemo(() => Object.fromEntries(docs.map((d) => [d.doc_type, d])), [docs]);
  const orderedDocs = INTAKE_DOCS.map((t) => ({ tpl: t, row: byType[t.type] })).filter((x) => x.row);
  const signedCount = docs.filter((d) => d.status === 'signed').length;
  const allSigned = docs.length === INTAKE_DOCS.length && signedCount === INTAKE_DOCS.length;

  const active = orderedDocs.find((x) => x.tpl.type === activeType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            Intake packet — {resident?.participant_name}
          </DialogTitle>
        </DialogHeader>

        {!active ? (
          <div className="overflow-y-auto pr-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-500">
                {signedCount} of {INTAKE_DOCS.length} documents signed
              </p>
              <div className="h-2 w-40 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-teal-500 transition-all"
                  style={{ width: `${(signedCount / INTAKE_DOCS.length) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {orderedDocs.map(({ tpl, row }) => (
                <button
                  key={tpl.type}
                  onClick={() => setActiveType(tpl.type)}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:border-teal-400 hover:bg-teal-50/40 transition"
                >
                  {row.status === 'signed' ? (
                    <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-slate-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      {tpl.title}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{tpl.intro}</div>
                  </div>
                  {row.status === 'signed' ? (
                    <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100">Signed</Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-300">Review</Badge>
                  )}
                </button>
              ))}
            </div>
            <Button
              className="w-full mt-4 bg-teal-600 hover:bg-teal-700"
              disabled={!allSigned}
              onClick={() => onComplete?.()}
            >
              {allSigned ? 'Finish & submit — all documents signed' : `Sign all ${INTAKE_DOCS.length} documents to finish`}
            </Button>
          </div>
        ) : (
          <DocReader
            tpl={active.tpl}
            row={active.row}
            onBack={() => setActiveType(null)}
            onSigned={() => {
              qc.invalidateQueries({ queryKey: ['rr_intake', resident?.id] });
              setActiveType(null);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DocReader({ tpl, row, onBack, onSigned }) {
  const qc = useQueryClient();
  const [data, setData] = useState(row.data || {});
  const [agreed, setAgreed] = useState(row.agreed || false);
  const [signedName, setSignedName] = useState(row.signed_name || data.full_name || '');
  const signed = row.status === 'signed';

  const sign = useMutation({
    mutationFn: () =>
      db.entities.RrIntakeDocument.update(row.id, {
        data,
        agreed: true,
        status: 'signed',
        signed_name: signedName,
        signed_date: format(new Date(), 'yyyy-MM-dd'),
      }),
    onSuccess: onSigned,
  });

  return (
    <div className="overflow-y-auto pr-1">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-3">
        <ArrowLeft className="w-4 h-4" /> All documents
      </button>
      <h3 className="text-lg font-semibold text-slate-800">{tpl.title}</h3>
      <p className="text-sm text-slate-500 mt-1">{tpl.intro}</p>

      {/* terms */}
      <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600 space-y-2 max-h-44 overflow-y-auto">
        {tpl.terms.map((t, i) => (
          <p key={i} className="leading-relaxed">• {t}</p>
        ))}
      </div>

      {/* fields (pre-filled from carry-over where available) */}
      {tpl.fields.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {tpl.fields.map((f) => (
            <div key={f.key} className={f.type === 'area' ? 'col-span-2' : ''}>
              <Label className="text-xs text-slate-500 flex items-center gap-1">
                {f.label}
                {f.from && data[f.key] ? (
                  <span className="text-[10px] text-teal-600 font-medium">· carried over</span>
                ) : null}
              </Label>
              {f.type === 'area' ? (
                <textarea
                  className="mt-1 w-full rounded-md border border-slate-200 p-2 text-sm"
                  rows={2}
                  disabled={signed}
                  value={data[f.key] || ''}
                  onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
                />
              ) : (
                <Input
                  type={f.type || 'text'}
                  className="mt-1"
                  disabled={signed}
                  value={data[f.key] || ''}
                  onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* sign / agree */}
      {signed ? (
        <div className="mt-5 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Signed by <b>{row.signed_name}</b> on {row.signed_date}.
        </div>
      ) : (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <label className="flex items-start gap-2 cursor-pointer">
            <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(Boolean(v))} className="mt-0.5" />
            <span className="text-sm text-slate-700">
              I have read and understand the <b>{tpl.title}</b>, and I agree to its terms.
            </span>
          </label>
          <div className="flex items-end gap-3 mt-3">
            <div className="flex-1">
              <Label className="text-xs text-slate-500 flex items-center gap-1">
                <PenLine className="w-3 h-3" /> Type your full name to sign
              </Label>
              <Input
                className="mt-1 font-medium italic"
                placeholder="Your full name"
                value={signedName}
                onChange={(e) => setSignedName(e.target.value)}
              />
            </div>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              disabled={!agreed || !signedName.trim() || sign.isPending}
              onClick={() => sign.mutate()}
            >
              {sign.isPending ? 'Signing…' : 'Sign & continue'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
