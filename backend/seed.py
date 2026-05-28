import os
import pandas as pd
import bcrypt
from sqlalchemy.orm import Session

from database import Base, SessionLocal, engine
import models


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def make_slug(name: str) -> str:
    return str(name).lower().replace(" ", "_").replace("-", "_").replace("\n", "_").strip()


def seed_data():
    import sys
    if sys.stdin.isatty():
        print("WARNING: This script will WIPE all existing database tables and re-seed.")
        confirm = input("Type 'yes' to proceed, or anything else to abort: ").strip().lower()
        if confirm != 'yes':
            print("Database seeding aborted.")
            return

    # 1. Create all tables in the database
    print("Creating all tables in the PostgreSQL database...")
    Base.metadata.drop_all(bind=engine)  # Drop existing for clean re-seeding
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

    db: Session = SessionLocal()

    try:
        # 2. Read divisions spreadsheet
        print("Reading Divisions List from Divisions List 27.05.2026.xlsx...")
        excel_path = "../Divisions List 27.05.2026.xlsx"
        
        # Read Excel without headers first to parse manually
        df = pd.read_excel(excel_path, header=None)
        
        # Row 0: Title, Row 1: Headers (Sl.No, Circle, Division), Row 2+: actual data
        df = df.iloc[2:]
        df.columns = ["sl_no", "circle_name", "division_name"]
        
        # Clean columns and forward-fill circles
        df["circle_name"] = df["circle_name"].ffill()
        df["circle_name"] = df["circle_name"].str.strip()
        df["division_name"] = df["division_name"].str.strip()

        print(f"Parsed {len(df)} division rows.")

        # Default password for all seed accounts
        default_pwd_hash = hash_password("Password123!")

        # 3. Create Super Admin (DCE - Deputy Chief Engineer)
        print("Creating Deputy Chief Engineer (DCE) Accounts...")
        dce_user1 = models.User(
            name="DCE Admin Main",
            email="dce@nhrs.gov.in",
            password_hash=default_pwd_hash,
            role="DCE",
            circle_id=None,
            division_id=None,
            assigned_dse_id=None,
            is_active=True
        )
        dce_user2 = models.User(
            name="DCE Admin Secondary",
            email="dce2@nhrs.gov.in",
            password_hash=default_pwd_hash,
            role="DCE",
            circle_id=None,
            division_id=None,
            assigned_dse_id=None,
            is_active=True
        )
        db.add(dce_user1)
        db.add(dce_user2)
        db.commit()

        # Realistic Tamil/South Indian names for authentic government representation
        dse_names = [
            "Er. A. Srinivasan",
            "Er. R. Sundaram",
            "Er. M. Ravichandran",
            "Er. P. Thangavel",
            "Er. S. Palanisamy",
            "Er. K. Rajendran",
            "Er. G. Subramanian",
            "Er. K. Jayaraman",
            "Er. S. Chandrasekaran",
            "Er. M. Arumugam"
        ]

        de_names = [
            "Er. K. Ramesh", "Er. S. Murugan", "Er. R. Elangovan", "Er. P. Balaji", "Er. V. Jayakumar",
            "Er. G. Ramakrishnan", "Er. T. Anbarasan", "Er. R. Venkatraman", "Er. N. Senthilkumar", "Er. A. Gunasekaran",
            "Er. R. Karthikeyan", "Er. S. Vijayakumar", "Er. M. Selvam", "Er. R. Nagarajan", "Er. S. Veeramani",
            "Er. P. Loganathan", "Er. K. Sundararajan", "Er. G. Venkatesan", "Er. K. Srinivasan", "Er. M. Kathiravan",
            "Er. P. Balakrishnan", "Er. S. Hariharan", "Er. T. Rajkumar", "Er. M. Ganesan", "Er. K. Saravanan",
            "Er. R. Natarajan", "Er. S. Muthu", "Er. P. Sivamurugan", "Er. K. Anandakrishnan", "Er. M. Thirunavukkarasu",
            "Er. R. Chidambaram", "Er. S. Ramasamy", "Er. V. Palanivel", "Er. K. Viswanathan", "Er. M. Chandran",
            "Er. R. Krishnakumar", "Er. S. Sivasubramanian", "Er. V. Meenakshisundaram", "Er. K. Padmanabhan", "Er. R. Raghuraman",
            "Er. S. Parthasarathy", "Er. G. Ranganathan", "Er. K. Devarajan", "Er. M. Kumaresan", "Er. R. Radhakrishnan",
            "Er. S. Swaminathan", "Er. V. Gurusamy", "Er. K. Jambulingam", "Er. M. Rajavel", "Er. P. Ramachandran"
        ]

        circle_counter = 0
        de_counter = 0

        # Dictionaries to store created Circles, Divisions, and DSE Users
        circle_map = {}
        division_map = {}
        dse_map = {}

        # 4. Process each row to seed Circles, Divisions, and Users
        for idx, row in df.iterrows():
            circle_name = row["circle_name"]
            division_name = row["division_name"]
            
            # Seed Circle if not already seeded
            if circle_name not in circle_map:
                circle = models.Circle(name=circle_name)
                db.add(circle)
                db.commit()
                db.refresh(circle)
                circle_map[circle_name] = circle.id
                print(f"Seeded Circle: {circle_name} (ID: {circle.id})")
                
                # Seed DSE (Deputy Superintendent Engineer) for this Circle
                dse_slug = make_slug(circle_name)
                dse_name = dse_names[circle_counter % len(dse_names)]
                circle_counter += 1
                
                dse = models.User(
                    name=dse_name,
                    email=f"dse_{dse_slug}@nhrs.gov.in",
                    password_hash=default_pwd_hash,
                    role="DSE",
                    circle_id=circle.id,
                    division_id=None,
                    assigned_dse_id=None,
                    is_active=True
                )
                db.add(dse)
                db.commit()
                db.refresh(dse)
                dse_map[circle.id] = dse.id
                print(f"  Created DSE User: {dse_name} (dse_{dse_slug}@nhrs.gov.in)")
            
            circle_id = circle_map[circle_name]
            
            # Seed Division
            division = models.Division(name=division_name, circle_id=circle_id)
            db.add(division)
            db.commit()
            db.refresh(division)
            division_map[division_name] = division.id
            print(f"    Seeded Division: {division_name} (ID: {division.id})")

            # Seed DE (Divisional Engineer) for this Division
            de_slug = make_slug(division_name)
            dse_id = dse_map[circle_id]
            de_name = de_names[de_counter % len(de_names)]
            de_counter += 1
            
            de = models.User(
                name=de_name,
                email=f"de_{de_slug}@nhrs.gov.in",
                password_hash=default_pwd_hash,
                role="DE",
                circle_id=circle_id,
                division_id=division.id,
                assigned_dse_id=dse_id, # Bind to their DSE manager automatically initially
                is_active=True
            )
            db.add(de)
            db.commit()
            print(f"      Created DE User: {de_name} (de_{de_slug}@nhrs.gov.in)")

        # 5. Seed a Sample Entry from the Sample Entries spreadsheet
        print("Seeding Sample Project Entry from Excel...")
        
        sample_path = "../Sample Entries.xlsx"
        sample_df = pd.read_excel(sample_path, header=None)
        
        # Row 1 contains actual column names, Row 2 has the sample data
        # We fetch the first DE user (CCR 1 DE) to be the creator
        ccr1_de = db.query(models.User).filter(models.User.email == "de_ccr_1@nhrs.gov.in").first()
        
        if ccr1_de:
            # Let's inspect the dates and safely convert
            def parse_date(val):
                if pd.isna(val):
                    return None
                try:
                    return pd.to_datetime(val).date()
                except Exception:
                    return None

            sample_entry = models.ProjectEntry(
                created_by_id=ccr1_de.id,
                circle_id=ccr1_de.circle_id,
                division_id=ccr1_de.division_id,
                scheme="CRIDP",
                year="2025-26",
                go_details="G.O.(Ms) No.105, Highways and Minor Ports Department, Dated: 15.05.2025",
                technical_sanction="CE (H), C&M, Chennai proc. No. 1567/Salai/2025, dated: 16.01.2026",
                admin_sanction_value=650.0,
                tech_sanction_value=650.0,
                tender_notice_no="10",
                tender_notice_date=parse_date("2026-05-26"),
                name_of_work="Widening from Two Lane to Four Lane and Strengthening at km 100/000 – 103/000 of Ramanathapuram – Nainarkoil – Andakudi – Elayankudi- Sivagangai – Melur road (SH 34) including cross Drainage works",
                contract_value=584.6,
                bid_submission_date=parse_date("2026-05-26"),
                bid_opening_date=parse_date("2026-05-26"),
                tender_accepting_authority="CE",
                tender_approved_on=parse_date("2026-05-26"),
                work_order_issued_on=parse_date("2026-05-26"),
                agreement_executed_on=parse_date("2026-05-26"),
                present_stage="Survey Work Completed",
                remarks="Initial project seeded successfully.",
                status="PENDING", # Seed as pending so the DSE can approve it
                submitted_at=models.datetime.datetime.utcnow()
            )
            
            db.add(sample_entry)
            db.commit()
            print("Sample project entry seeded successfully!")

        print("\nDatabase seeding completed successfully! Total users, circles, and divisions are created.")

    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
