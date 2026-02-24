---
on:  # Trigger: when to run
  issues:
    types: [opened]

permissions:
  contents: read

safe-outputs:
  add-comment:

  update-issue:
    status:                   # enable status updates

---
# Analyzer

Analyze the current issue for the Hollydayz application. Ask for additional required questions to make issue more clear.

If issue is not related with Hollydayz repo. politly ask to create issues related with related with Hollydayz and close the issue.