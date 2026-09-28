# -*- coding: utf-8 -*-
"""Data model shared by the RFQ parser, the offer generator and the GUI.

Everything is a plain dataclass so it can be dumped to / loaded from JSON and
reviewed (or corrected) by the user before the offer document is generated.
"""
from __future__ import annotations

import dataclasses
import json
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

DATE_FMT = "%d.%m.%Y"


# --------------------------------------------------------------------------- RFQ side
@dataclass
class Milestone:
    """Abnahmemeilenstein (AM) of a work package."""
    ap: int
    nr: int
    title: str
    termin: str = "gemäß Liefertermin der Einzelbestellung"
    kriterien: List[str] = field(default_factory=list)

    @property
    def am_id(self) -> str:
        return f"{self.ap}.{self.nr}"


@dataclass
class WorkPackage:
    """Arbeitspaket (AP) as described in the Leistungsbeschreibung."""
    nr: int
    title: str
    zeitraum_von: str = ""
    zeitraum_bis: str = ""
    gegenstand: List[str] = field(default_factory=list)
    aufgabe: List[str] = field(default_factory=list)        # paragraphs before the task bullets
    tasks: List[str] = field(default_factory=list)          # bullet list
    auspraegungen: List[str] = field(default_factory=list)  # "Ausprägung klein (AP1.1): ..."
    reisekosten: List[str] = field(default_factory=list)
    milestones: List[Milestone] = field(default_factory=list)
    extra: List[str] = field(default_factory=list)          # anything not classified


@dataclass
class PriceRow:
    am: str            # "1.1"
    menge: str = ""    # unverbindliche Menge
    termin: str = "*"  # Abnahme-Termin
    zeitraum: str = "" # Zeitraum Lieferung ab Bestellung
    betrag: str = ""
    optional: bool = True   # blue shading = optional scope


@dataclass
class Block:
    """One paragraph of RFQ text (already OCR-cleaned)."""
    text: str
    bullet: bool = False
    heading: bool = False


@dataclass
class SimpleTable:
    rows: List[List[str]]
    header: bool = True


@dataclass
class RFQData:
    """Everything the generator needs from the Leistungsbeschreibung."""
    abteilung: str = ""
    lfd_nr: str = ""
    titel: str = ""
    version: str = ""
    version_datum: str = ""
    ansprechpartner: str = ""          # "Nachname, Vorname"
    ansprechpartner_abteilung: str = ""
    leistungszeitraum_von: str = ""
    leistungszeitraum_bis: str = ""
    hauptstandort: str = ""
    aufgabenstellung: List[Block] = field(default_factory=list)
    aufgabenstellung_tabellen: List[SimpleTable] = field(default_factory=list)
    leistungsumfang_intro: List[Block] = field(default_factory=list)
    arbeitspakete: List[WorkPackage] = field(default_factory=list)
    dokumentation: List[Block] = field(default_factory=list)
    preise: Dict[str, List[PriceRow]] = field(default_factory=dict)   # key = str(AP nr)
    allgemeiner_teil: List[str] = field(default_factory=list)          # row texts of "Allgemeiner Teil"
    beistellungen: List[Tuple[str, List[str], str]] = field(default_factory=list)  # (title, desc lines, Anzahl)
    language: str = "de"
    warnings: List[str] = field(default_factory=list)

    # ---- (de)serialisation
    def to_json(self, indent: int = 2) -> str:
        return json.dumps(dataclasses.asdict(self), ensure_ascii=False, indent=indent)

    @classmethod
    def from_json(cls, text: str) -> "RFQData":
        raw = json.loads(text)
        return cls.from_dict(raw)

    @classmethod
    def from_dict(cls, raw: Dict[str, Any]) -> "RFQData":
        d = dict(raw)
        d["aufgabenstellung"] = [Block(**b) for b in d.get("aufgabenstellung", [])]
        d["leistungsumfang_intro"] = [Block(**b) for b in d.get("leistungsumfang_intro", [])]
        d["dokumentation"] = [Block(**b) for b in d.get("dokumentation", [])]
        d["aufgabenstellung_tabellen"] = [SimpleTable(**t) for t in d.get("aufgabenstellung_tabellen", [])]
        aps = []
        for ap in d.get("arbeitspakete", []):
            ap = dict(ap)
            ap["milestones"] = [Milestone(**m) for m in ap.get("milestones", [])]
            aps.append(WorkPackage(**ap))
        d["arbeitspakete"] = aps
        d["preise"] = {k: [PriceRow(**r) for r in v] for k, v in d.get("preise", {}).items()}
        d["beistellungen"] = [tuple(x) if not isinstance(x, tuple) else x for x in d.get("beistellungen", [])]
        known = {f.name for f in dataclasses.fields(cls)}
        return cls(**{k: v for k, v in d.items() if k in known})


# --------------------------------------------------------------------------- offer side
def add_one_month(d: date) -> date:
    month = d.month + 1
    year = d.year + (month - 1) // 12
    month = (month - 1) % 12 + 1
    day = d.day
    while True:
        try:
            return date(year, month, day)
        except ValueError:
            day -= 1


def parse_date(s: str) -> Optional[date]:
    s = (s or "").strip()
    for fmt in (DATE_FMT, "%d.%m.%y", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


@dataclass
class OfferConfig:
    """User supplied parameters (steps 2, 4, 11, 14, 15 of the internal guide)."""
    template_path: str = ""
    rfq_path: str = ""
    output_dir: str = ""
    output_name: str = ""             # empty -> "<Nr> - Angebot - <Titel>.docx"

    angebot_nr: str = ""              # from PLM, e.g. 26.0577.01
    projekt_titel: str = ""           # from PLM
    datum: str = ""                   # dd.mm.yyyy, empty -> today
    gueltig_bis: str = ""             # empty -> datum + 1 month
    unsere_zeichen: str = "PEG-V / TÖ"
    kam_name: str = "Tuncay Özcelik"
    kam_email: str = "tuncay.oezcelik@porsche.de"
    kam_anrede: str = "Herr Özcelik"
    projektleiter: str = ""           # "Herr Mustermann"; empty -> highlighted placeholder
    ansprechpartner: str = ""         # "Herr Dambacher, Frank"; empty -> from RFQ
    ansprechpartner_anrede: str = ""  # "Herr Dambacher"; empty -> derived
    abteilung_kurz: str = ""          # "EEB2"; empty -> from RFQ if possible
    projektstart: str = ""            # empty -> RFQ Leistungszeitraum
    projektende: str = ""
    strasse: str = "Porschestraße 911"
    plz_ort: str = "71287 Weissach"

    grammar_check: bool = True
    grammar_autocorrect: bool = True
    grammar_backend: str = "auto"     # auto | offline | local | public
    language: str = "auto"            # auto | de | en

    def resolved_datum(self) -> str:
        d = parse_date(self.datum) or date.today()
        return d.strftime(DATE_FMT)

    def resolved_gueltig_bis(self) -> str:
        if self.gueltig_bis.strip():
            return self.gueltig_bis.strip()
        d = parse_date(self.resolved_datum()) or date.today()
        return add_one_month(d).strftime(DATE_FMT)

    def to_json(self) -> str:
        return json.dumps(dataclasses.asdict(self), ensure_ascii=False, indent=2)

    @classmethod
    def from_json(cls, text: str) -> "OfferConfig":
        raw = json.loads(text)
        known = {f.name for f in dataclasses.fields(cls)}
        return cls(**{k: v for k, v in raw.items() if k in known})


@dataclass
class GrammarIssue:
    context: str
    message: str
    replacements: List[str]
    rule: str
    applied: bool = False
    location: str = ""


@dataclass
class BuildReport:
    output_path: str = ""
    steps: List[Tuple[str, str, str]] = field(default_factory=list)   # (step, status, note)
    grammar_issues: List[GrammarIssue] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)

    def step(self, name: str, status: str, note: str = "") -> None:
        self.steps.append((name, status, note))

    def as_text(self) -> str:
        lines = [f"Ausgabe: {self.output_path}", "", "Prüfliste (15 Schritte):"]
        for name, status, note in self.steps:
            lines.append(f"  [{status:^6}] {name}" + (f" - {note}" if note else ""))
        if self.warnings:
            lines += ["", "Hinweise:"] + [f"  - {w}" for w in self.warnings]
        if self.grammar_issues:
            applied = sum(1 for g in self.grammar_issues if g.applied)
            lines += ["", f"Grammatik / Rechtschreibung: {len(self.grammar_issues)} Funde, {applied} automatisch korrigiert"]
            for g in self.grammar_issues[:200]:
                flag = "korrigiert" if g.applied else "prüfen"
                rep = f" -> {g.replacements[0]}" if g.replacements else ""
                lines.append(f"  - [{flag}] {g.context}{rep}  ({g.message})")
        return "\n".join(lines)
