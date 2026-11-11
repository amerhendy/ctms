def test_full_exam_flow(client, admin_headers):
    # 1) إنشاء نموذج وظيفة
    r = client.post(
        "/api/v1/job-models",
        json={"name": "وظيفة اختبار", "description": "desc", "duration_minutes": 30},
        headers=admin_headers,
    )
    assert r.status_code == 200
    job_model_id = r.json()["id"]

    # 2) إضافة سؤالين (اختيار من متعدد + نصي)
    r = client.post(
        "/api/v1/questions",
        json={
            "job_model_id": job_model_id,
            "q_type": "mcq",
            "question_text": "2 + 2 = ?",
            "question_data": {"options": ["3", "4", "5", "6"], "correct_index": 1},
            "points": 2,
            "order_index": 1,
        },
        headers=admin_headers,
    )
    assert r.status_code == 200

    r = client.post(
        "/api/v1/questions",
        json={
            "job_model_id": job_model_id,
            "q_type": "excel_formula",
            "question_text": "SUM formula",
            "question_data": {"answer_keywords": ["SUM(A1:A10)"]},
            "points": 3,
            "order_index": 2,
        },
        headers=admin_headers,
    )
    assert r.status_code == 200

    # 3) إضافة متقدم
    r = client.post(
        "/api/v1/applicants",
        json={"national_id": "12345", "full_name": "Test Applicant", "job_model_id": job_model_id},
        headers=admin_headers,
    )
    assert r.status_code == 200
    access_code = r.json()["access_code"]

    # 4) دخول المتقدم للاختبار
    r = client.post("/api/v1/exam/login", json={"access_code": access_code})
    assert r.status_code == 200
    login_data = r.json()
    applicant_token = login_data["token"]
    questions = login_data["questions"]
    assert len(questions) == 2

    applicant_headers = {"Authorization": f"Bearer {applicant_token}"}

    # 5) حفظ الإجابات دفعة واحدة
    answers = []
    for q in questions:
        if q["q_type"] == "mcq":
            answers.append({"question_id": q["id"], "answer_data": {"selected_index": 1}})
        else:
            answers.append({"question_id": q["id"], "answer_data": {"text": "=SUM(A1:A10)"}})

    r = client.post("/api/v1/exam/save-batch", json={"answers": answers}, headers=applicant_headers)
    assert r.status_code == 200
    assert all(res["success"] for res in r.json()["results"])

    # 6) تسجيل مخالفة
    r = client.post(
        "/api/v1/exam/log-violation",
        json={"violation_type": "tab_switch", "details": "test"},
        headers=applicant_headers,
    )
    assert r.status_code == 200

    # 7) إنهاء الاختبار
    r = client.post("/api/v1/exam/finish", headers=applicant_headers)
    assert r.status_code == 200
    result = r.json()["result"]
    assert result["total_score"] == 5.0
    assert result["max_score"] == 5.0

    # 8) التحقق من عدم إمكانية الدخول مرة أخرى بنفس الكود
    r = client.post("/api/v1/exam/login", json={"access_code": access_code})
    assert r.status_code == 403

    # 9) تحميل تقرير PDF من لوحة الأدمن
    applicants_list = client.get("/api/v1/applicants", headers=admin_headers).json()
    applicant_id = applicants_list[0]["id"]
    r = client.get(f"/api/v1/applicants/{applicant_id}/pdf", headers=admin_headers)
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/pdf"
