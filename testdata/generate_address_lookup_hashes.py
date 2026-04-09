#!/usr/bin/env python3
"""Print lookup hashes for the current seeded address rows."""

from __future__ import annotations

import csv
import hashlib
import re
import sys


FIELD_NAMES = [
    "address_line_1",
    "address_line_2",
    "city",
    "state_region",
    "postal_code",
    "country_code",
]

SEEDED_ADDRESSES = [
    {
        "address_id": 1,
        "address_line_1": "3 Bagshot Row",
        "address_line_2": None,
        "city": "Hobbiton",
        "state_region": "The Shire",
        "postal_code": None,
        "country_code": None,
    },
    {
        "address_id": 2,
        "address_line_1": "Brandy Hall",
        "address_line_2": None,
        "city": "Bucklebury",
        "state_region": "Buckland",
        "postal_code": None,
        "country_code": None,
    },
    {
        "address_id": 3,
        "address_line_1": "The Great Smials",
        "address_line_2": None,
        "city": "Tuckborough",
        "state_region": "Tookland",
        "postal_code": None,
        "country_code": None,
    },
    {
        "address_id": 4,
        "address_line_1": "Stone Gate",
        "address_line_2": None,
        "city": "Erebor",
        "state_region": "Kingdom under the Mountain",
        "postal_code": None,
        "country_code": None,
    },
]

WHITESPACE_PATTERN = re.compile(r"\s+")


def trim_to_null(value: str | None) -> str | None:
    if value is None:
        return None

    trimmed_value = value.strip()
    return trimmed_value or None


def normalize_for_lookup(value: str | None) -> str:
    trimmed_value = trim_to_null(value)
    if trimmed_value is None:
        return "<null>"

    return WHITESPACE_PATTERN.sub(" ", trimmed_value).lower()


def build_lookup_hash(row: dict[str, str | int | None]) -> tuple[str, str]:
    normalized_parts = [normalize_for_lookup(row.get(field_name)) for field_name in FIELD_NAMES]
    normalized_address = "|".join(normalized_parts)
    digest = hashlib.sha256(normalized_address.encode("utf-8")).hexdigest()
    return digest, normalized_address


def main() -> int:
    writer = csv.DictWriter(
        sys.stdout,
        fieldnames=[
            "address_id",
            *FIELD_NAMES,
            "address_lookup_hash",
            "normalized_address_lookup",
        ],
    )
    writer.writeheader()

    for address in SEEDED_ADDRESSES:
        digest, normalized_address = build_lookup_hash(address)
        writer.writerow(
            {
                **address,
                "address_lookup_hash": digest,
                "normalized_address_lookup": normalized_address,
            }
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
