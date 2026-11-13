import Foundation

@main struct ToddleRubricRegression {
    static func main() {
        // Synthetic equivalent structures; no real student data.
        let english = """
        Learning intentions
        OREO teaching example: O pinion, R eason, E xample, O pinion.
        Learning goals
        Learner Profile Attributes
        Caring
        Ind.
        Thinkers
        Obs.
        Standards
        Example English
        Assessment Criteria
        SPEAKING AND LISTENING STRAND
        -
        CONCEPTUAL UNDERSTANDING FOR SPEAKING AND LISTENING
        -
        We consider the listener's perspective when communicating clearly. (Phase 4)
        C
        Expresses ideas and listens respectfully to other people's contributions
        M
        Your response
        Visible rubric criterion and rating in the same row:
        OREO teaching example: O pinion, R eason, E xample, O pinion. E
        We consider the listener's perspective when communicating clearly. (Phase 4) C
        Expresses ideas and listens respectfully to other people's contributions M
        """
        let a=ToddleRubric.extract(english)!
        precondition(a.rows.map(\.rating)==["C","M"] && a.complete)
        precondition(!a.rows.contains { $0.criterion.contains("OREO") })
        let math = """
        Assessment Criteria
        NUMBER STRAND
        -
        Reads four-digit numbers and explains what each digit represents
        C
        Rounds whole numbers to the nearest hundred and thousand
        C
        Solves multi-step addition problems and explains the method
        C
        Your response
        Visible rubric criterion and rating in the same row:
        Reads four-digit numbers and explains what each digit represents C
        Rounds whole numbers to the nearest hundred and thousand C
        Solves multi-step addition problems and explains the method C
        """
        let m=ToddleRubric.extract(math)!
        precondition(m.rows.map(\.rating)==["C","C","C"] && m.complete)
        let uncertain = """
        Assessment Criteria
        A long synthetic criterion with no reliable rubric level recorded
        Your response
        """
        let x=ToddleRubric.extract(uncertain)!
        precondition(x.rows.count==1 && x.rows[0].rating.isEmpty && !x.complete)
        print("Toddle rubric: English C/M, math C/C/C, OREO E ignored, missing grade remains blank")
    }
}
