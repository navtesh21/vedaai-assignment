import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { QuestionPaper, Section, Question } from '@/lib/store';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.5,
    color: '#000000',
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  schoolName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
  },
  studentSection: {
    border: '1pt solid #000',
    padding: 10,
    marginBottom: 20,
  },
  studentField: {
    marginBottom: 6,
  },
  instructionBlock: {
    fontStyle: 'italic',
    marginBottom: 15,
  },
  sectionBlock: {
    marginTop: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  sectionInstruction: {
    fontStyle: 'italic',
    marginBottom: 10,
  },
  questionBlock: {
    flexDirection: 'row',
    marginBottom: 12,
    breakInside: 'avoid',
  },
  questionNumber: {
    width: 20,
    fontWeight: 'bold',
  },
  questionContent: {
    flex: 1,
  },
  questionText: {
    marginBottom: 4,
  },
  optionsList: {
    marginLeft: 10,
    marginTop: 2,
  },
  optionText: {
    marginBottom: 2,
  },
  questionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  difficultyTag: {
    fontSize: 9,
    color: '#666',
    backgroundColor: '#eee',
    padding: '2 6',
    borderRadius: 4,
  },
  marksText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  endMarker: {
    textAlign: 'center',
    marginTop: 30,
    fontWeight: 'bold',
    fontSize: 12,
  }
});

interface Props {
  paper: QuestionPaper;
}

export const QuestionPaperPDF = ({ paper }: Props) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.schoolName}>{paper.school}</Text>
        <Text style={styles.metaText}>Subject: {paper.subject}  |  Class: {paper.class}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text>Time Allowed: {paper.timeAllowed}</Text>
        <Text>Maximum Marks: {paper.maxMarks}</Text>
      </View>

      <View style={styles.instructionBlock}>
        <Text>All questions are compulsory unless stated otherwise.</Text>
      </View>

      {/* Student Info */}
      <View style={styles.studentSection}>
        <Text style={styles.studentField}>Name: _______________________</Text>
        <Text style={styles.studentField}>Roll Number: ___________________</Text>
        <Text style={styles.studentField}>Class: {paper.class}     Section: __________</Text>
      </View>

      {/* Sections & Questions */}
      {paper.sections.map((section, sIdx) => (
        <View key={sIdx} style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionInstruction}>{section.instruction}</Text>

          {section.questions.map((q, qIdx) => {
            const cleanText = q.text
              .replace(/^\[(Easy|Moderate|Challenging|Hard|Medium)\]\s*/i, '')
              .replace(/\[\d+\s*Marks?\]$/i, '')
              .trim();

            return (
              <View key={qIdx} style={styles.questionBlock} wrap={false}>
                <Text style={styles.questionNumber}>{q.number}.</Text>
                
                <View style={styles.questionContent}>
                  <Text style={styles.questionText}>{cleanText}</Text>
                  
                  {q.type === 'mcq' && q.options && (
                    <View style={styles.optionsList}>
                      {q.options.map((opt, oIdx) => (
                        <Text key={oIdx} style={styles.optionText}>{opt}</Text>
                      ))}
                    </View>
                  )}
                  
                  {q.type === 'truefalse' && (
                    <View style={styles.optionsList}>
                      <Text style={styles.optionText}>○ True</Text>
                      <Text style={styles.optionText}>○ False</Text>
                    </View>
                  )}

                  <View style={styles.questionMeta}>
                    <Text style={styles.difficultyTag}>{q.difficulty.toUpperCase()}</Text>
                    <Text style={styles.marksText}>[{q.marks} Mark{q.marks > 1 ? 's' : ''}]</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ))}

      {/* End Marker */}
      <View style={styles.endMarker}>
        <Text>*** END OF QUESTION PAPER ***</Text>
      </View>
      
    </Page>
  </Document>
);
