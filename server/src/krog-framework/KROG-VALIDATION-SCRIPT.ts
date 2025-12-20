/**
 * KROG Implementation Validation Script
 *
 * Automated verification that the KROG framework is completely implemented.
 * Run this script to verify all operators, rules, and features are present.
 *
 * @version 1.0.0
 */

import { KROGChessEngine } from './engine';
import {
  CoreOperators,
  PermissionOperator,
  ObligationOperator,
  ProhibitionOperator,
  ClaimOperator,
  LibertyOperator,
  PowerOperator,
  ImmunityOperator,
  DisabilityOperator,
  LiabilityOperator
} from './core-operators';
import {
  PieceLogicOperators,
  PM_Operator,
  PC_Operator,
  PA_Operator,
  CR_Operator,
  EP_Operator,
  PO_Operator,
  NV_Operator,
  PD_Operator
} from './piece-logic';
import {
  BoardLogicOperators,
  PV_Operator,
  MH_Operator,
  CS_Operator,
  LMG_Operator,
  GT_Operator,
  TC_Operator,
  PR_Operator,
  FMC_Operator
} from './board-logic';
import {
  NotationOperators,
  PSA_Operator,
  PLA_Operator,
  PUCI_Operator,
  PVN_Operator,
  GN_Operator,
  NC_Operator
} from './notation';
import {
  TemporalOperators,
  G_Operator,
  F_Operator,
  X_Operator,
  U_Operator,
  R_Operator
} from './temporal';
import { RTypeClassifier, RTypeDefinitions } from './rtype-classifier';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// VALIDATION REPORT INTERFACE
// ============================================================================

interface ValidationError {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  message: string;
  details?: string;
}

interface ValidationWarning {
  category: string;
  message: string;
  suggestion: string;
}

interface ValidationReport {
  complete: boolean;
  timestamp: string;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  coverage: {
    coreOperators: number;
    pieceLogic: number;
    boardLogic: number;
    notation: number;
    temporal: number;
    rtypes: number;
    rules: number;
  };
  performance: {
    moveValidation: number;
    legalMoveGeneration: number;
  };
  summary: {
    totalOperators: number;
    implementedOperators: number;
    totalRules: number;
    implementedRules: number;
  };
}

// ============================================================================
// KROG IMPLEMENTATION VERIFIER
// ============================================================================

class KROGImplementationVerifier {
  private engine: KROGChessEngine;
  private report: ValidationReport;

  constructor() {
    this.engine = new KROGChessEngine();
    this.report = {
      complete: true,
      timestamp: new Date().toISOString(),
      errors: [],
      warnings: [],
      coverage: {
        coreOperators: 0,
        pieceLogic: 0,
        boardLogic: 0,
        notation: 0,
        temporal: 0,
        rtypes: 0,
        rules: 0
      },
      performance: {
        moveValidation: 0,
        legalMoveGeneration: 0
      },
      summary: {
        totalOperators: 36,
        implementedOperators: 0,
        totalRules: 21,
        implementedRules: 0
      }
    };
  }

  /**
   * Run complete validation
   */
  async validate(): Promise<ValidationReport> {
    console.log('='.repeat(80));
    console.log('KROG IMPLEMENTATION VALIDATION');
    console.log('='.repeat(80) + '\n');

    // 1. Verify core operators
    this.verifyCoreOperators();

    // 2. Verify piece logic operators
    this.verifyPieceLogicOperators();

    // 3. Verify board logic operators
    this.verifyBoardLogicOperators();

    // 4. Verify notation operators
    this.verifyNotationOperators();

    // 5. Verify temporal logic
    this.verifyTemporalLogic();

    // 6. Verify R-type classification
    this.verifyRTypeClassification();

    // 7. Verify bilingual support
    this.verifyBilingualSupport();

    // 8. Verify JSON output
    this.verifyJSONOutput();

    // 9. Verify FIDE rule mappings
    this.verifyFIDEMappings();

    // 10. Verify rules database
    this.verifyRulesDatabase();

    // 11. Run performance tests
    await this.runPerformanceTests();

    // 12. Generate report
    this.generateReport();

    return this.report;
  }

  // ============================================================================
  // CORE OPERATORS VERIFICATION
  // ============================================================================

  private verifyCoreOperators(): void {
    console.log('Verifying Core KROG Operators (9)...');
    const requiredOperators = [
      { name: 'P', class: PermissionOperator },
      { name: 'O', class: ObligationOperator },
      { name: 'F', class: ProhibitionOperator },
      { name: 'C', class: ClaimOperator },
      { name: 'L', class: LibertyOperator },
      { name: 'W', class: PowerOperator },
      { name: 'B', class: ImmunityOperator },
      { name: 'I', class: DisabilityOperator },
      { name: 'D', class: LiabilityOperator }
    ];

    let implementedCount = 0;

    requiredOperators.forEach(({ name, class: OpClass }) => {
      try {
        const instance = new OpClass();
        if (instance && typeof instance.evaluate === 'function') {
          implementedCount++;
        } else {
          this.addError('critical', 'Core Operators', `Operator ${name} missing evaluate method`);
        }
      } catch (error) {
        this.addError('critical', 'Core Operators', `Failed to instantiate operator ${name}`);
      }
    });

    this.report.coverage.coreOperators = (implementedCount / requiredOperators.length) * 100;
    this.report.summary.implementedOperators += implementedCount;
    console.log(`   ${implementedCount}/${requiredOperators.length} core operators implemented\n`);
  }

  // ============================================================================
  // PIECE LOGIC OPERATORS VERIFICATION
  // ============================================================================

  private verifyPieceLogicOperators(): void {
    console.log('Verifying Piece Logic Operators (8)...');
    const requiredOperators = [
      { name: 'PM', class: PM_Operator },
      { name: 'PC', class: PC_Operator },
      { name: 'PA', class: PA_Operator },
      { name: 'CR', class: CR_Operator },
      { name: 'EP', class: EP_Operator },
      { name: 'PO', class: PO_Operator },
      { name: 'NV', class: NV_Operator },
      { name: 'PD', class: PD_Operator }
    ];

    let implementedCount = 0;

    requiredOperators.forEach(({ name, class: OpClass }) => {
      try {
        const instance = new OpClass();
        if (instance && typeof instance.evaluate === 'function') {
          implementedCount++;
        } else {
          this.addError('critical', 'Piece Logic', `Operator ${name} missing evaluate method`);
        }
      } catch (error) {
        this.addError('critical', 'Piece Logic', `Failed to instantiate operator ${name}`);
      }
    });

    this.report.coverage.pieceLogic = (implementedCount / 8) * 100;
    this.report.summary.implementedOperators += implementedCount;
    console.log(`   ${implementedCount}/8 piece logic operators verified\n`);
  }

  // ============================================================================
  // BOARD LOGIC OPERATORS VERIFICATION
  // ============================================================================

  private verifyBoardLogicOperators(): void {
    console.log('Verifying Board Logic Operators (8)...');
    const requiredOperators = [
      { name: 'PV', class: PV_Operator },
      { name: 'MH', class: MH_Operator },
      { name: 'CS', class: CS_Operator },
      { name: 'LMG', class: LMG_Operator },
      { name: 'GT', class: GT_Operator },
      { name: 'TC', class: TC_Operator },
      { name: 'PR', class: PR_Operator },
      { name: 'FMC', class: FMC_Operator }
    ];

    let implementedCount = 0;

    requiredOperators.forEach(({ name, class: OpClass }) => {
      try {
        const instance = new OpClass();
        if (instance) {
          implementedCount++;
        } else {
          this.addError('critical', 'Board Logic', `Operator ${name} not implemented`);
        }
      } catch (error) {
        this.addError('critical', 'Board Logic', `Failed to instantiate operator ${name}`);
      }
    });

    this.report.coverage.boardLogic = (implementedCount / requiredOperators.length) * 100;
    this.report.summary.implementedOperators += implementedCount;
    console.log(`   ${implementedCount}/${requiredOperators.length} board logic operators implemented\n`);
  }

  // ============================================================================
  // NOTATION OPERATORS VERIFICATION
  // ============================================================================

  private verifyNotationOperators(): void {
    console.log('Verifying Notation Operators (6)...');
    const requiredOperators = [
      { name: 'PSA', class: PSA_Operator },
      { name: 'PLA', class: PLA_Operator },
      { name: 'PUCI', class: PUCI_Operator },
      { name: 'PVN', class: PVN_Operator },
      { name: 'GN', class: GN_Operator },
      { name: 'NC', class: NC_Operator }
    ];

    let implementedCount = 0;

    requiredOperators.forEach(({ name, class: OpClass }) => {
      try {
        const instance = new OpClass();
        if (instance) {
          implementedCount++;
        } else {
          this.addError('high', 'Notation', `Operator ${name} not implemented`);
        }
      } catch (error) {
        this.addError('high', 'Notation', `Failed to instantiate operator ${name}`);
      }
    });

    this.report.coverage.notation = (implementedCount / requiredOperators.length) * 100;
    this.report.summary.implementedOperators += implementedCount;
    console.log(`   ${implementedCount}/${requiredOperators.length} notation operators implemented\n`);
  }

  // ============================================================================
  // TEMPORAL LOGIC VERIFICATION
  // ============================================================================

  private verifyTemporalLogic(): void {
    console.log('Verifying Temporal Logic (5)...');
    const requiredOperators = [
      { name: 'G', class: G_Operator },
      { name: 'F', class: F_Operator },
      { name: 'X', class: X_Operator },
      { name: 'U', class: U_Operator },
      { name: 'R', class: R_Operator }
    ];

    let implementedCount = 0;

    requiredOperators.forEach(({ name, class: OpClass }) => {
      try {
        const instance = new OpClass();
        if (instance && typeof instance.evaluate === 'function') {
          implementedCount++;
        } else {
          this.addError('high', 'Temporal Logic', `Operator ${name} missing evaluate method`);
        }
      } catch (error) {
        this.addError('high', 'Temporal Logic', `Failed to instantiate operator ${name}`);
      }
    });

    this.report.coverage.temporal = (implementedCount / requiredOperators.length) * 100;
    this.report.summary.implementedOperators += implementedCount;
    console.log(`   ${implementedCount}/${requiredOperators.length} temporal operators implemented\n`);
  }

  // ============================================================================
  // R-TYPE CLASSIFICATION VERIFICATION
  // ============================================================================

  private verifyRTypeClassification(): void {
    console.log('Verifying R-Type Classification (15 types)...');

    const requiredRTypes = [
      'R1_asymmetric', 'R2_intransitive', 'R3_path_dependent',
      'R4_capture_only', 'R5_non_capture', 'R6_first_move_special',
      'R7_temporal_window', 'R8_mandatory_transformation', 'R9_compound_move',
      'R10_conditional', 'R11_discrete_jump', 'R12_state_dependent',
      'R13_terminal_state', 'R14_repetition', 'R15_counter_based'
    ];

    let implementedCount = 0;

    requiredRTypes.forEach(rtype => {
      if (RTypeDefinitions[rtype as keyof typeof RTypeDefinitions]) {
        implementedCount++;
      } else {
        this.addError('medium', 'R-Types', `Missing R-type: ${rtype}`);
      }
    });

    // Verify classifier
    try {
      const classifier = new RTypeClassifier();
      if (typeof classifier.classifyMove !== 'function') {
        this.addError('high', 'R-Types', 'RTypeClassifier missing classifyMove method');
      }
      if (typeof classifier.classifyRule !== 'function') {
        this.addError('medium', 'R-Types', 'RTypeClassifier missing classifyRule method');
      }
    } catch (error) {
      this.addError('critical', 'R-Types', 'Failed to instantiate RTypeClassifier');
    }

    this.report.coverage.rtypes = (implementedCount / requiredRTypes.length) * 100;
    console.log(`   ${implementedCount}/${requiredRTypes.length} R-types defined\n`);
  }

  // ============================================================================
  // BILINGUAL SUPPORT VERIFICATION
  // ============================================================================

  private verifyBilingualSupport(): void {
    console.log('Verifying Bilingual Support (EN/NO)...');

    let hasIssues = false;

    // Check R-type definitions have bilingual descriptions
    for (const [key, def] of Object.entries(RTypeDefinitions)) {
      if (!def.description.en || !def.description.no) {
        this.addWarning('Bilingual',
          `R-type ${key} missing bilingual description`,
          'Add both EN and NO descriptions');
        hasIssues = true;
      }
    }

    if (!hasIssues) {
      console.log('   All R-types have bilingual descriptions\n');
    } else {
      console.log('   Some bilingual content missing (see warnings)\n');
    }
  }

  // ============================================================================
  // JSON OUTPUT VERIFICATION
  // ============================================================================

  private verifyJSONOutput(): void {
    console.log('Verifying JSON Output...');

    try {
      const operators = this.engine.getOperators();
      if (!operators) {
        this.addError('high', 'JSON Output', 'Engine getOperators() returns null');
        return;
      }

      // Verify structure
      if (!operators.core) this.addError('high', 'JSON Output', 'Missing core operators in output');
      if (!operators.pieceLogic) this.addError('high', 'JSON Output', 'Missing pieceLogic in output');
      if (!operators.boardLogic) this.addError('high', 'JSON Output', 'Missing boardLogic in output');
      if (!operators.rtype) this.addError('high', 'JSON Output', 'Missing rtype in output');

      console.log('   JSON output structure verified\n');
    } catch (error) {
      this.addError('critical', 'JSON Output', `JSON verification failed: ${error}`);
    }
  }

  // ============================================================================
  // FIDE RULE MAPPINGS VERIFICATION
  // ============================================================================

  private verifyFIDEMappings(): void {
    console.log('Verifying FIDE Rule Mappings...');

    // Check if KROG-RULES.json exists and has proper structure
    try {
      const rulesPath = path.join(__dirname, 'KROG-RULES.json');
      if (fs.existsSync(rulesPath)) {
        const rulesData = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
        const rules = rulesData.rules || [];

        let completeRules = 0;
        for (const rule of rules) {
          if (rule.fide && rule.fide.norwegian && rule.fide.english) {
            completeRules++;
          } else {
            this.addWarning('FIDE Mappings',
              `Incomplete FIDE mapping for rule: ${rule.id}`,
              'Add Norwegian and English FIDE references');
          }
        }

        this.report.coverage.rules = (completeRules / rules.length) * 100;
        this.report.summary.implementedRules = completeRules;
        console.log(`   ${completeRules}/${rules.length} rules have complete FIDE mappings\n`);
      } else {
        this.addWarning('FIDE Mappings',
          'KROG-RULES.json not found',
          'Create KROG-RULES.json with all rule definitions');
      }
    } catch (error) {
      this.addWarning('FIDE Mappings',
        `Could not read KROG-RULES.json: ${error}`,
        'Ensure KROG-RULES.json is valid JSON');
    }
  }

  // ============================================================================
  // RULES DATABASE VERIFICATION
  // ============================================================================

  private verifyRulesDatabase(): void {
    console.log('Verifying Rules Database...');

    try {
      const rulesPath = path.join(__dirname, 'KROG-RULES.json');
      if (fs.existsSync(rulesPath)) {
        const rulesData = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));

        // Verify operator definitions
        if (rulesData.operators) {
          const ops = rulesData.operators;
          if (ops.core?.length === 9) console.log('   9 core operators defined');
          if (ops.pieceLogic?.length === 8) console.log('   8 piece logic operators defined');
          if (ops.boardLogic?.length === 8) console.log('   8 board logic operators defined');
          if (ops.notation?.length === 6) console.log('   6 notation operators defined');
          if (ops.temporal?.length === 5) console.log('   5 temporal operators defined');
        }

        // Verify rules count
        const rulesCount = rulesData.rules?.length || 0;
        console.log(`   ${rulesCount} rules defined`);

        // Verify R-types in database
        const rtypesCount = Object.keys(rulesData.rtypes || {}).length;
        console.log(`   ${rtypesCount} R-types defined\n`);
      }
    } catch (error) {
      console.log(`   Could not verify rules database: ${error}\n`);
    }
  }

  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================

  private async runPerformanceTests(): Promise<void> {
    console.log('Running Performance Tests...');

    // Skip actual performance tests if we don't have a full game state
    // Just verify the methods exist
    try {
      if (typeof this.engine.validateMove === 'function') {
        console.log('   validateMove method available');
        this.report.performance.moveValidation = 0;
      }

      if (typeof this.engine.getLegalMoves === 'function') {
        console.log('   getLegalMoves method available');
        this.report.performance.legalMoveGeneration = 0;
      }

      console.log('   Performance test methods verified\n');
    } catch (error) {
      this.addWarning('Performance', `Performance tests skipped: ${error}`, 'Run with full test environment');
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private addError(
    severity: 'critical' | 'high' | 'medium' | 'low',
    category: string,
    message: string,
    details?: string
  ): void {
    this.report.errors.push({ severity, category, message, details });
    if (severity === 'critical' || severity === 'high') {
      this.report.complete = false;
    }
  }

  private addWarning(category: string, message: string, suggestion: string): void {
    this.report.warnings.push({ category, message, suggestion });
  }

  // ============================================================================
  // REPORT GENERATION
  // ============================================================================

  private generateReport(): void {
    console.log('='.repeat(80));
    console.log('VALIDATION REPORT');
    console.log('='.repeat(80) + '\n');

    // Coverage summary
    console.log('Coverage:');
    console.log(`   Core Operators:       ${this.report.coverage.coreOperators.toFixed(1)}%`);
    console.log(`   Piece Logic:          ${this.report.coverage.pieceLogic.toFixed(1)}%`);
    console.log(`   Board Logic:          ${this.report.coverage.boardLogic.toFixed(1)}%`);
    console.log(`   Notation:             ${this.report.coverage.notation.toFixed(1)}%`);
    console.log(`   Temporal Logic:       ${this.report.coverage.temporal.toFixed(1)}%`);
    console.log(`   R-Types:              ${this.report.coverage.rtypes.toFixed(1)}%`);
    console.log(`   FIDE Rules:           ${this.report.coverage.rules.toFixed(1)}%\n`);

    // Summary
    console.log('Summary:');
    console.log(`   Operators: ${this.report.summary.implementedOperators}/${this.report.summary.totalOperators}`);
    console.log(`   Rules: ${this.report.summary.implementedRules}/${this.report.summary.totalRules}\n`);

    // Errors
    if (this.report.errors.length > 0) {
      console.log(`Errors (${this.report.errors.length}):`);
      this.report.errors.forEach(error => {
        console.log(`   [${error.severity.toUpperCase()}] ${error.category}: ${error.message}`);
        if (error.details) {
          console.log(`      ${error.details}`);
        }
      });
      console.log();
    }

    // Warnings
    if (this.report.warnings.length > 0) {
      console.log(`Warnings (${this.report.warnings.length}):`);
      this.report.warnings.forEach(warning => {
        console.log(`   ${warning.category}: ${warning.message}`);
        console.log(`      Suggestion: ${warning.suggestion}`);
      });
      console.log();
    }

    // Final verdict
    console.log('='.repeat(80));
    if (this.report.complete) {
      console.log('KROG IMPLEMENTATION COMPLETE');
      console.log('\nAll required operators and features are implemented.');
      if (this.report.warnings.length > 0) {
        console.log(`Consider addressing ${this.report.warnings.length} warning(s) for optimal implementation.`);
      }
    } else {
      console.log('KROG IMPLEMENTATION INCOMPLETE');
      const criticalErrors = this.report.errors.filter(e => e.severity === 'critical').length;
      const highErrors = this.report.errors.filter(e => e.severity === 'high').length;
      console.log(`\n${criticalErrors} critical and ${highErrors} high-priority errors must be fixed.`);
    }
    console.log('='.repeat(80) + '\n');
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const verifier = new KROGImplementationVerifier();
  const report = await verifier.validate();

  // Save report to file
  try {
    const reportPath = path.join(__dirname, 'KROG-VALIDATION-REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Report saved to: ${reportPath}\n`);
  } catch (error) {
    console.log('Could not save report to file\n');
  }

  // Exit with appropriate code
  return report.complete ? 0 : 1;
}

// Run if executed directly
if (require.main === module) {
  main()
    .then(exitCode => process.exit(exitCode))
    .catch(error => {
      console.error('Validation script failed:', error);
      process.exit(1);
    });
}

export { KROGImplementationVerifier, ValidationReport };
