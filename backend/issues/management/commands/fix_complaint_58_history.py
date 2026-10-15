from django.core.management.base import BaseCommand
from django.db import transaction
from issues.models import Complaint, ComplaintStatusHistory

class Command(BaseCommand):
    help = 'Safely cleans up duplicate and erroneous Resolved history records for Complaint #58 while preserving valid audit history.'

    def handle(self, *args, **options):
        self.stdout.write("Inspecting Complaint #58 status history...")

        complaint = Complaint.objects.filter(id=58).first()
        if not complaint:
            self.stdout.write(self.style.WARNING("Complaint #58 not found in database. Nothing to clean."))
            return

        with transaction.atomic():
            history_qs = ComplaintStatusHistory.objects.filter(complaint=complaint).order_by('id')
            self.stdout.write(f"Found {history_qs.count()} history records for Complaint #58:")

            for h in history_qs:
                self.stdout.write(f"  Before: H#{h.id} status={h.status} by={h.updated_by} remarks={repr(h.remarks)}")

            # 1. Identify and remove exact duplicate assignment record H#107 (duplicate of H#106)
            duplicate_record = ComplaintStatusHistory.objects.filter(
                id=107,
                complaint=complaint,
                remarks='Assigned to Sanitation Department with 4 staff member(s).'
            ).first()
            if duplicate_record:
                duplicate_record.delete()
                self.stdout.write(self.style.SUCCESS("  -> Deleted duplicate assignment record H#107."))

            # 2. Correct assignment records H#104 and H#106 from 'Resolved' to 'In Progress'
            assignment_records = ComplaintStatusHistory.objects.filter(
                complaint=complaint,
                id__in=[104, 106],
                status='Resolved'
            )
            for ar in assignment_records:
                ar.status = 'In Progress'
                ar.save()
                self.stdout.write(self.style.SUCCESS(f"  -> Corrected assignment record H#{ar.id} status to 'In Progress'."))

            # 3. Correct staff completion note H#103 from 'Resolved' to 'In Progress'
            staff_record = ComplaintStatusHistory.objects.filter(
                complaint=complaint,
                id=103,
                status='Resolved'
            ).first()
            if staff_record:
                staff_record.status = 'In Progress'
                staff_record.save()
                self.stdout.write(self.style.SUCCESS("  -> Corrected staff record H#103 status to 'In Progress'."))

            # 4. Set Complaint #58 status to 'In Progress' since it is assigned to Sanitation Department with 4 active staff members
            if complaint.status == 'Resolved':
                complaint.status = 'In Progress'
                complaint.save()
                self.stdout.write(self.style.SUCCESS("  -> Updated Complaint #58 status to 'In Progress'."))

        self.stdout.write(self.style.SUCCESS("\nSuccessfully sanitized history for Complaint #58."))
        
        # Print final history state
        self.stdout.write("\nFinal history state for Complaint #58:")
        for h in ComplaintStatusHistory.objects.filter(complaint=complaint).order_by('id'):
            self.stdout.write(f"  After: H#{h.id} status={h.status} by={h.updated_by} remarks={repr(h.remarks)}")
