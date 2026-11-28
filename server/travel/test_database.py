import unittest

from travel.database import database_config_from_url, selected_database_url


class DatabaseConfigTests(unittest.TestCase):
    def test_transaction_pooler_disables_prepared_statements_and_persistent_connections(
        self,
    ):
        config = database_config_from_url(
            "postgresql://postgres.test:secret@pooler.example.test:6543/postgres?pgbouncer=true",
            sslmode="verify-full",
            serverless=True,
        )

        self.assertEqual(config["ENGINE"], "django.db.backends.postgresql")
        self.assertEqual(config["PORT"], "6543")
        self.assertEqual(config["CONN_MAX_AGE"], 0)
        self.assertIsNone(config["OPTIONS"]["prepare_threshold"])
        self.assertEqual(config["OPTIONS"]["sslmode"], "verify-full")
        self.assertNotIn("pgbouncer", config["OPTIONS"])

    def test_percent_encoded_credentials_and_database_name_are_decoded(self):
        config = database_config_from_url(
            "postgresql://pool%40role:p%40ss%2Fword@db.example.com/travel%20data",
            sslmode="verify-full",
            serverless=False,
        )

        self.assertEqual(config["USER"], "pool@role")
        self.assertEqual(config["PASSWORD"], "p@ss/word")
        self.assertEqual(config["NAME"], "travel data")
        self.assertEqual(config["PORT"], "5432")
        self.assertEqual(config["CONN_MAX_AGE"], 60)

    def test_non_postgresql_scheme_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "PostgreSQL"):
            database_config_from_url(
                "mysql://user:password@db.example.com/travel",
                sslmode="verify-full",
                serverless=True,
            )

    def test_missing_password_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "credentials"):
            database_config_from_url(
                "postgresql://user@db.example.com/travel",
                sslmode="verify-full",
                serverless=True,
            )

    def test_insecure_tls_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "verify-full"):
            database_config_from_url(
                "postgresql://user:password@db.example.com/travel?sslmode=disable",
                sslmode="verify-full",
                serverless=True,
            )

    def test_unknown_query_parameters_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "Unsupported"):
            database_config_from_url(
                "postgresql://user:password@db.example.com/travel?sslmode=verify-full&unknown=value",
                sslmode="verify-full",
                serverless=True,
            )

    def test_migration_mode_selects_the_session_mode_url(self):
        selected = selected_database_url(
            database_url="postgresql://runtime:secret@pooler.example.test:6543/postgres?pgbouncer=true",
            direct_url="postgresql://migrator:secret@pooler.example.test:5432/postgres",
            migrations=True,
        )

        self.assertIn(":5432/", selected)

    def test_runtime_ignores_the_session_mode_migration_url(self):
        runtime = "postgresql://runtime:secret@pooler.example.test:6543/postgres?pgbouncer=true"
        selected = selected_database_url(
            database_url=runtime,
            direct_url="postgresql://migrator:secret@pooler.example.test:5432/postgres",
            migrations=False,
        )

        self.assertEqual(selected, runtime)

    def test_migration_mode_requires_a_direct_url(self):
        with self.assertRaisesRegex(ValueError, "DIRECT_URL"):
            selected_database_url(
                database_url="postgresql://runtime:secret@pooler.example.test:6543/postgres?pgbouncer=true",
                direct_url="",
                migrations=True,
            )


if __name__ == "__main__":
    unittest.main()
