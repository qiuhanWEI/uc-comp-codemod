import { Grid } from "react_components";
import React from "react";

const {
  Row: Row,
  Col: Col
} = Grid;

const { test } = Row;

export default () => (
  <div>
    <Row type={"flex"}>
      <Col span={2}>
        <div>1</div>
      </Col>
      <Col span={2}>
        <div>2</div>
      </Col>
      <Col span={2}>
        <div>23</div>
      </Col>
      <Col span={2}>
        <div>24</div>
      </Col>
    </Row>
  </div>
);
