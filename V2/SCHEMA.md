# Khidma v2 - Data Schema

**Finalized: 2026-11-08**

## Design Principles

1. **Normalization** - people are entities, not strings on records
2. **Multiple funding** - a kafala can be funded by several sources
3. **Structured prepaid** - `prepaid_through: "YYYY-MM"` instead of free text
4. **Random UUIDs** - no content-hash collisions
5. **Explicit relationships** - foreign keys, not implicit name matching
6. **Controlled vocabularies** - enums for area/status/case_type/source
7. **Immutable closed months** - snapshot at close, no silent edits
8. **Append-only audit** - every write logged

## Root Structure

```
/khidma_v2/
  /people/          # person registry (guardians, kafeels, PTs)
  /kafalat/         # child sponsorship cases
  /months/          # monthly operations
  /audit/           # change log
  /backups/         # automated snapshots
  /config/          # fixed values (sadaqat baseline, fees, etc.)
```

---

## /khidma_v2/people/{person_uuid}

```json
{
  "name": "فاتنات نصير",
  "aliases": ["فاتنات", "فاتنة"],
  "roles": ["pt", "kafeel", "guardian"],
  "area": "الصف",
  "phone": null,
  "notes": "",
  "active": true,
  "created_at": 1730000000000,
  "updated_at": 1730000000000
}
```

Fields:
- `name` - primary display name
- `aliases` - alternative spellings (for matching)
- `roles` - array; a person can be multiple roles
- `area` - home area (useful for guardians; nullable)
- `phone` / `notes` - optional
- `active` - false = archived

---

## /khidma_v2/kafalat/{kafala_uuid}

```json
{
  "child": "عبدالرحمن أحمد حسين",
  "guardian_id": "p_a1b2c3d4...",
  "area": "الصف",
  "case_type": "كفالة_يتيم",
  "status": "active",
  "funding": [
    {
      "fid": "f_e5f6a7b8...",
      "source": "kafeel",
      "kafeel_id": "p_fatenat...",
      "pt_id": "p_fatenat...",
      "amount": 500,
      "start_ym": "2025-01",
      "prepaid_through": "2027-01",
      "notes": ""
    },
    {
      "fid": "f_c9d0e1f2...",
      "source": "sadaqat",
      "amount": 250,
      "start_ym": "2026-03",
      "notes": "نشوى صلاح زيادة ثابتة"
    }
  ],
  "notes": "",
  "created_at": 1730000000000,
  "updated_at": 1730000000000
}
```

Enums:
- `area`: `"الصف" | "كفر_علو" | "المعصرة" | "أماكن_أخرى"`
- `case_type`: `"كفالة_يتيم" | "كفالة_طالب" | "أرملة" | "حالات_خاصة" | "خبز"`
- `status`: `"active" | "paused" | "ended"`
- `funding[].source`: `"kafeel" | "sadaqat" | "zakat"`

Validation rules:
- At least one funding entry for `active` status
- `funding[].amount > 0`
- `funding[].start_ym` ≤ current month
- `funding[].prepaid_through` ≥ `start_ym` (if present)
- `kafeel_id` required when `source = "kafeel"`

---

## /khidma_v2/months/{yyyy-mm}/

```json
{
  "status": "draft",
  "created_at": 1730000000000,
  "closed_at": null,
  "closed_by": "youssef",
  
  "edits": {
    "edit_uuid": {
      "type": "funding_update",
      "target_id": "kafala_uuid",
      "sub_id": "funding_uuid",
      "before": {"amount": 500},
      "after": {"amount": 900},
      "note": "رفع المبلغ بناءً على طلب الشيخ",
      "ts": 1730000000000,
      "author": "youssef"
    }
  },
  
  "collection": {
    "pt_uuid": {
      "expected_total": 10000,
      "collected_total": 9500,
      "kafeel_payments": {
        "kafeel_uuid": {
          "expected": 2500,
          "status": "paid",
          "paid_amount": 2500,
          "paid_at": 1730000000000,
          "notes": ""
        }
      }
    }
  },
  
  "sadaqat_pool": {
    "fixed_input": 4550,
    "nashwa_contribution": 15000,
    "output_needed": 35000,
    "shortage_covered_from_nashwa": 30450,
    "surplus": 0
  },
  
  "zakat": {
    "nashwa_amount": 45000,
    "available_for_distribution": 14550,
    "share_per_person": 300,
    "distributions": {
      "person_uuid": 300
    }
  },
  
  "transfer_plan": {
    "by_area": {
      "الصف": {"total": 114840, "youssef": 0, "nashwa": 114840},
      "كفر_علو": {"total": 111290, "youssef": 19360, "nashwa": 91930}
    },
    "kafr_olw_fee_pct": 1.0,
    "totals": {"grand": 266470, "youssef": 56200, "nashwa": 210270}
  },
  
  "snapshot_kafalat": { ... },
  "snapshot_people": { ... }
}
```

Lifecycle:
- `draft` - edits allowed, not final
- `closed` - locked; edits need unlock

---

## /khidma_v2/audit/{entry_uuid}

Append-only log:
```json
{
  "ts": 1730000000000,
  "author": "youssef",
  "action": "kafala_update|funding_add|funding_remove|month_close|...",
  "path": "/kafalat/{uuid}/funding/0/amount",
  "before": 500,
  "after": 900,
  "related": {"kafala_id": "...", "month": "2026-11"}
}
```

---

## /khidma_v2/config/

```json
{
  "sadaqat_fixed_sponsors": {
    "نورا": 1000,
    "إجلال": 1550,
    "داليا": 2000
  },
  "sadaqat_fixed_total": 4550,
  "kafr_olw_fee_pct": 1.0,
  "current_month": "2026-11",
  "schema_version": "2.0",
  "frozen_months": ["2026-10"]
}
```

---

## Migration from v1

Source → Target:

| v1 | v2 |
|----|----|
| `/khidma/kafalat/{hash}/` | `/khidma_v2/kafalat/{uuid}/` + extract people to `/people/` |
| `/khidma/kafalat/{...}/kafeel: "صدقات"` | `funding[].source = "sadaqat"` |
| `/khidma/kafalat/{...}/kafeel: "{name}"` | `funding[].kafeel_id → /people/` |
| `/khidma/kafalat/{...}/paid_until` | `funding[].prepaid_through` |
| `/khidma/kafalat/{...}/active` | `status: active|ended` |
| `/khidma/months/{ym}/` | `/khidma_v2/months/{ym}/` |
| `/nashwa_collection/state/` | distributed to `/months/{ym}/collection/` |

Multi-funding cases (عبدالرحمن, زهره, خبز) get CORRECT single kafala with multiple funding[].
